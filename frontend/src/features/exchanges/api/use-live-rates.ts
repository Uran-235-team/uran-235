import { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { env } from '@/shared/config/env'
import type { LiveRates } from '@/entities/exchange/types'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

function buildWsUrl(exchangeId: string) {
  const url = new URL(env.apiUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/api/v1/ws/rates'
  url.search = `?exchange_id=${encodeURIComponent(exchangeId)}`
  return url.toString()
}

export function useLiveRates(exchangeId: string | null | undefined) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [rates, setRates] = useState<LiveRates>({})
  const [status, setStatus] = useState<Status>('idle')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!exchangeId || !accessToken) {
      setRates({})
      setStatus('idle')
      return
    }

    setRates({})
    setStatus('connecting')
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
        if (payload && typeof payload === 'object') {
          setRates(payload as LiveRates)
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

  return { rates, status }
}
