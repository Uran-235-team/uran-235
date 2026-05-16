import { useEffect, useEffectEvent, useReducer, useRef } from 'react'

import type {
  CurrencyChartPoint,
  CurrencyChartSeries,
  LiveRates,
  PricedRates,
} from '@/entities/exchange/types'
import { getPricedRates } from '@/services/api/exchanges-api'
import { normalizeApiError } from '@/services/api/client'

const GRAPH_UPDATE_INTERVAL_MS = 1_500
const CHART_WINDOW_SIZE = 24

type ChartsState = {
  series: CurrencyChartSeries
  pricedRates: PricedRates
  isSyncing: boolean
  syncError: string | null
  lastUpdatedAt: number | null
  hasBufferedUpdates: boolean
}

type ChartsAction =
  | { type: 'reset' }
  | { type: 'prune-series'; nextSeries: CurrencyChartSeries }
  | { type: 'buffered'; value: boolean }
  | { type: 'sync-start' }
  | {
      type: 'sync-success'
      pricedRates: PricedRates
      nextSeries: CurrencyChartSeries
      lastUpdatedAt: number
      hasBufferedUpdates: boolean
    }
  | { type: 'sync-error'; message: string; hasBufferedUpdates: boolean }

const initialState: ChartsState = {
  series: {},
  pricedRates: {},
  isSyncing: false,
  syncError: null,
  lastUpdatedAt: null,
  hasBufferedUpdates: false,
}

function reducer(state: ChartsState, action: ChartsAction): ChartsState {
  switch (action.type) {
    case 'reset':
      return initialState
    case 'prune-series':
      return {
        ...state,
        series: action.nextSeries,
      }
    case 'buffered':
      return {
        ...state,
        hasBufferedUpdates: action.value,
      }
    case 'sync-start':
      return {
        ...state,
        isSyncing: true,
        syncError: null,
      }
    case 'sync-success':
      return {
        series: action.nextSeries,
        pricedRates: action.pricedRates,
        isSyncing: false,
        syncError: null,
        lastUpdatedAt: action.lastUpdatedAt,
        hasBufferedUpdates: action.hasBufferedUpdates,
      }
    case 'sync-error':
      return {
        ...state,
        isSyncing: false,
        syncError: action.message,
        hasBufferedUpdates: action.hasBufferedUpdates,
      }
    default:
      return state
  }
}

function toFiniteNumber(value: number | string | null | undefined) {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function appendPoint(
  current: CurrencyChartSeries,
  rawRates: LiveRates,
  pricedRates: PricedRates,
  sampleAt: number,
  activeCodes: ReadonlySet<string>,
): CurrencyChartSeries {
  const next = filterSeriesByCodes(current, activeCodes)

  for (const currency of activeCodes) {
    const rawValue = rawRates[currency]
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) continue

    const point: CurrencyChartPoint = {
      id: `${sampleAt}-${currency}`,
      at: sampleAt,
      raw: rawValue,
      final: toFiniteNumber(pricedRates[currency]?.final),
    }

    const history = next[currency] ?? []
    next[currency] = [...history.slice(-(CHART_WINDOW_SIZE - 1)), point]
  }

  return next
}

function filterSeriesByCodes(
  series: CurrencyChartSeries,
  activeCodes: ReadonlySet<string>,
): CurrencyChartSeries {
  if (activeCodes.size === 0) return {}

  const next: CurrencyChartSeries = {}
  for (const code of activeCodes) {
    const points = series[code]
    if (points && points.length > 0) {
      next[code] = points
    }
  }

  return next
}

function isDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

export function usePricedRateCharts(
  exchangeId: string | null | undefined,
  liveRates: LiveRates,
  messageCount: number,
  activeCurrencyCodes: readonly string[],
) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const timerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const generationRef = useRef(0)
  const latestRatesRef = useRef<LiveRates>({})
  const pendingVersionRef = useRef(0)
  const lastAttemptedVersionRef = useRef(0)
  const lastProcessedVersionRef = useRef(0)
  const lastFlushAtRef = useRef(0)
  const latestSeriesRef = useRef<CurrencyChartSeries>({})
  const activeCurrencyCodesRef = useRef<readonly string[]>([])

  useEffect(() => {
    latestRatesRef.current = liveRates
  }, [liveRates])

  useEffect(() => {
    latestSeriesRef.current = state.series
  }, [state.series])

  useEffect(() => {
    activeCurrencyCodesRef.current = activeCurrencyCodes

    const nextSeries = filterSeriesByCodes(
      latestSeriesRef.current,
      new Set(activeCurrencyCodes),
    )

    latestSeriesRef.current = nextSeries
    dispatch({ type: 'prune-series', nextSeries })
  }, [activeCurrencyCodes])

  useEffect(() => {
    generationRef.current += 1
    pendingVersionRef.current = 0
    lastAttemptedVersionRef.current = 0
    lastProcessedVersionRef.current = 0
    lastFlushAtRef.current = 0
    inFlightRef.current = false
    latestSeriesRef.current = {}

    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    dispatch({ type: 'reset' })
  }, [exchangeId])

  const flushPending = useEffectEvent(async () => {
    if (!exchangeId || inFlightRef.current) return
    if (pendingVersionRef.current <= lastAttemptedVersionRef.current) return

    const sampledRates = latestRatesRef.current
    if (Object.keys(sampledRates).length === 0) return

    const generation = generationRef.current
    const sampledVersion = pendingVersionRef.current
    const sampleAt = Date.now()
    const sampledActiveCodes = new Set(activeCurrencyCodesRef.current)

    lastAttemptedVersionRef.current = sampledVersion
    lastFlushAtRef.current = sampleAt
    inFlightRef.current = true
    dispatch({ type: 'sync-start' })

    try {
      const response = await getPricedRates(exchangeId)

      if (generationRef.current !== generation) return

      lastProcessedVersionRef.current = sampledVersion
      const nextSeries = appendPoint(
        latestSeriesRef.current,
        sampledRates,
        response.rates,
        sampleAt,
        sampledActiveCodes,
      )
      latestSeriesRef.current = nextSeries

      dispatch({
        type: 'sync-success',
        pricedRates: response.rates,
        nextSeries,
        lastUpdatedAt: sampleAt,
        hasBufferedUpdates:
          pendingVersionRef.current > lastProcessedVersionRef.current,
      })
    } catch (error) {
      if (generationRef.current === generation) {
        dispatch({
          type: 'sync-error',
          message: normalizeApiError(error).message,
          hasBufferedUpdates:
            pendingVersionRef.current > lastProcessedVersionRef.current,
        })
      }
    } finally {
      if (generationRef.current === generation) {
        inFlightRef.current = false

        if (
          pendingVersionRef.current > lastAttemptedVersionRef.current &&
          timerRef.current == null
        ) {
          const elapsed = Date.now() - lastFlushAtRef.current
          const delay = Math.max(0, GRAPH_UPDATE_INTERVAL_MS - elapsed)

          timerRef.current = window.setTimeout(() => {
            timerRef.current = null
            void flushPending()
          }, delay)
        }
      }
    }
  })

  useEffect(() => {
    if (!exchangeId || messageCount === 0) return

    pendingVersionRef.current = messageCount
    dispatch({
      type: 'buffered',
      value: pendingVersionRef.current > lastProcessedVersionRef.current,
    })

    if (isDocumentHidden()) return
    if (timerRef.current != null || inFlightRef.current) return

    const elapsed = Date.now() - lastFlushAtRef.current
    const delay =
      lastFlushAtRef.current === 0 ? 0 : Math.max(0, GRAPH_UPDATE_INTERVAL_MS - elapsed)

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      void flushPending()
    }, delay)
  }, [exchangeId, messageCount])

  useEffect(() => {
    if (!exchangeId || typeof document === 'undefined') return

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      if (pendingVersionRef.current <= lastProcessedVersionRef.current) return
      if (timerRef.current != null || inFlightRef.current) return

      const elapsed = Date.now() - lastFlushAtRef.current
      const delay =
        lastFlushAtRef.current === 0 ? 0 : Math.max(0, GRAPH_UPDATE_INTERVAL_MS - elapsed)

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void flushPending()
      }, delay)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [exchangeId])

  return state
}
