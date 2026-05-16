import { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { env } from '@/shared/config/env'
import type { LiveRates, LiveRatesMessage } from '@/entities/exchange/types'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

function buildWsUrl(exchangeId: string) {
  const url = new URL(env.apiUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/api/v1/ws/rates'
  url.search = `?exchange_id=${encodeURIComponent(exchangeId)}`
  return url.toString()
}

function parseRatesPayload(payload: unknown): LiveRatesMessage | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (record.type === 'auth') return null

  if (record.rates && typeof record.rates === 'object') {
    const rates: LiveRates = {}
    for (const [currency, value] of Object.entries(record.rates as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        rates[currency] = value
      }
    }
    return {
      rates,
      observedAt: typeof record.observed_at === 'string' ? record.observed_at : null,
    }
  }

  const rates: LiveRates = {}
  for (const [currency, value] of Object.entries(record)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      rates[currency] = value
    }
  }
  return { rates, observedAt: null }
}

export function useLiveRates(exchangeId: string | null | undefined) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [rates, setRates] = useState<LiveRates>({})
  const [observedAt, setObservedAt] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null)
  const [messageCount, setMessageCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!exchangeId || !accessToken) {
      setRates({})
      setObservedAt(null)
      setStatus('idle')
      setLastMessageAt(null)
      setMessageCount(0)
      return
    }

    setRates({})
    setObservedAt(null)
    setStatus('connecting')
    setLastMessageAt(null)
    setMessageCount(0)
    const ws = new WebSocket(buildWsUrl(exchangeId))
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ token: accessToken }))
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload && payload.type === 'auth') {
          if (payload.status === 'ok') setStatus('open')
          else setStatus('error')
          return
        }

        const parsed = parseRatesPayload(payload)
        if (parsed) {
          setRates(parsed.rates)
          setObservedAt(parsed.observedAt)
          setLastMessageAt(Date.now())
          setMessageCount((current) => current + 1)
        }
      } catch {
        // ignore malformed frame
      }
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus((current) => (current === 'error' ? 'error' : 'closed'))
    }

    return () => {
      wsRef.current = null
      ws.close()
    }
  }, [exchangeId, accessToken])

  return { rates, observedAt, status, lastMessageAt, messageCount }
}
