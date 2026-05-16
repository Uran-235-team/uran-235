import { useEffect, useReducer, useRef } from 'react'

import type { LiveRates, LiveRatesMessage } from '@/entities/exchange/types'
import { useCurrencySuggestionsStore } from '@/features/exchanges/model/currency-suggestions-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { normalizeApiError, refreshSessionTokens } from '@/services/api/client'
import { env } from '@/shared/config/env'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

const RECONNECT_BASE_DELAY_MS = 750
const RECONNECT_MAX_DELAY_MS = 5_000

type LiveRatesState = {
  rates: LiveRates
  observedAt: string | null
  status: Status
  lastMessageAt: number | null
  messageCount: number
}

type LiveRatesAction =
  | { type: 'reset' }
  | { type: 'connecting' }
  | { type: 'auth'; ok: boolean }
  | { type: 'data'; rates: LiveRates; observedAt: string | null; at: number }
  | { type: 'error' }
  | { type: 'closed' }

const idleState: LiveRatesState = {
  rates: {},
  observedAt: null,
  status: 'idle',
  lastMessageAt: null,
  messageCount: 0,
}

function reducer(state: LiveRatesState, action: LiveRatesAction): LiveRatesState {
  switch (action.type) {
    case 'reset':
      return idleState
    case 'connecting':
      return {
        rates: {},
        observedAt: null,
        status: 'connecting',
        lastMessageAt: null,
        messageCount: 0,
      }
    case 'auth':
      return {
        ...state,
        status: action.ok ? 'open' : 'error',
      }
    case 'data':
      return {
        rates: action.rates,
        observedAt: action.observedAt,
        status: state.status === 'error' ? 'error' : state.status,
        lastMessageAt: action.at,
        messageCount: state.messageCount + 1,
      }
    case 'error':
      return {
        ...state,
        status: 'error',
      }
    case 'closed':
      return {
        ...state,
        status: state.status === 'error' ? 'error' : 'closed',
      }
    default:
      return state
  }
}

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
  const rememberFromRates = useCurrencySuggestionsStore((state) => state.rememberFromRates)
  const [state, dispatch] = useReducer(reducer, idleState)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const connectionIdRef = useRef(0)
  const retryAttemptRef = useRef(0)

  useEffect(() => {
    function clearReconnectTimer() {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    function closeSocket() {
      const activeSocket = wsRef.current
      wsRef.current = null

      if (
        activeSocket &&
        (activeSocket.readyState === WebSocket.CONNECTING ||
          activeSocket.readyState === WebSocket.OPEN)
      ) {
        activeSocket.close()
      }
    }

    if (!exchangeId || !accessToken) {
      connectionIdRef.current += 1
      retryAttemptRef.current = 0
      clearReconnectTimer()
      closeSocket()
      dispatch({ type: 'reset' })
      return
    }

    let isDisposed = false
    const activeExchangeId = exchangeId
    const connectionId = connectionIdRef.current + 1
    connectionIdRef.current = connectionId
    retryAttemptRef.current = 0

    function scheduleReconnect(immediate = false) {
      if (
        isDisposed ||
        connectionIdRef.current !== connectionId ||
        !exchangeId ||
        !useAuthStore.getState().accessToken
      ) {
        return
      }

      clearReconnectTimer()

      const delay = immediate
        ? 0
        : Math.min(
            RECONNECT_MAX_DELAY_MS,
            RECONNECT_BASE_DELAY_MS * 2 ** Math.max(0, retryAttemptRef.current - 1),
          )

      reconnectTimerRef.current = window.setTimeout(() => {
        if (isDisposed || connectionIdRef.current !== connectionId) return
        reconnectTimerRef.current = null
        dispatch({ type: 'connecting' })
        connect()
      }, delay)
    }

    async function handleSocketClose(socket: WebSocket, event: CloseEvent) {
      if (isDisposed || connectionIdRef.current !== connectionId) return
      if (wsRef.current === socket) {
        wsRef.current = null
      }

      const isAuthClose = event.code === 1008 && /auth|token/i.test(event.reason)
      let shouldReconnect = true

      if (isAuthClose) {
        try {
          const refreshedToken = await refreshSessionTokens()
          shouldReconnect = Boolean(refreshedToken)
        } catch (error) {
          shouldReconnect = false
          dispatch({ type: 'error' })
          console.error('Unable to refresh live rates session', normalizeApiError(error))
        }
      }

      if (isDisposed || connectionIdRef.current !== connectionId) return

      if (event.code !== 1000) {
        dispatch({ type: 'error' })
      } else {
        dispatch({ type: 'closed' })
      }

      if (!shouldReconnect || !useAuthStore.getState().accessToken) {
        return
      }

      retryAttemptRef.current += 1
      scheduleReconnect()
    }

    function connect() {
      if (isDisposed || connectionIdRef.current !== connectionId) return

      closeSocket()
      clearReconnectTimer()

      const ws = new WebSocket(buildWsUrl(activeExchangeId))
      wsRef.current = ws

      ws.onopen = () => {
        if (isDisposed || connectionIdRef.current !== connectionId || wsRef.current !== ws) {
          return
        }

        retryAttemptRef.current = 0
        ws.send(
          JSON.stringify({
            token: useAuthStore.getState().accessToken,
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload && payload.type === 'auth') {
            dispatch({ type: 'auth', ok: payload.status === 'ok' })
            return
          }

          const parsed = parseRatesPayload(payload)
          if (parsed) {
            rememberFromRates(parsed.rates)
            dispatch({
              type: 'data',
              rates: parsed.rates,
              observedAt: parsed.observedAt,
              at: Date.now(),
            })
          }
        } catch {
          // Ignore malformed frame.
        }
      }

      ws.onerror = () => {
        if (isDisposed || connectionIdRef.current !== connectionId) return
        dispatch({ type: 'error' })
      }

      ws.onclose = (event) => {
        void handleSocketClose(ws, event)
      }
    }

    dispatch({ type: 'connecting' })
    connect()

    return () => {
      isDisposed = true
      if (connectionIdRef.current === connectionId) {
        connectionIdRef.current += 1
      }
      retryAttemptRef.current = 0
      clearReconnectTimer()
      closeSocket()
    }
  }, [accessToken, exchangeId, rememberFromRates])

  return state
}
