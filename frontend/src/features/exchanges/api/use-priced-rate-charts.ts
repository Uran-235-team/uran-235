import { useEffect, useRef, useState } from 'react'

import type {
  CurrencyChartPoint,
  CurrencyChartSeries,
  LiveRates,
  PricedRates,
} from '@/entities/exchange/types'
import { getPricedRates } from '@/services/api/exchanges-api'
import { normalizeApiError } from '@/services/api/client'

const GRAPH_UPDATE_INTERVAL_MS = 1_000
const HISTORY_LIMIT = 24

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
): CurrencyChartSeries {
  const next = { ...current }

  for (const [currency, rawValue] of Object.entries(rawRates)) {
    const point: CurrencyChartPoint = {
      id: `${sampleAt}-${currency}`,
      at: sampleAt,
      raw: rawValue,
      final: toFiniteNumber(pricedRates[currency]?.final),
    }

    const history = next[currency] ?? []
    next[currency] = [...history.slice(-(HISTORY_LIMIT - 1)), point]
  }

  return next
}

export function usePricedRateCharts(
  exchangeId: string | null | undefined,
  liveRates: LiveRates,
  messageCount: number,
) {
  const [series, setSeries] = useState<CurrencyChartSeries>({})
  const [pricedRates, setPricedRates] = useState<PricedRates>({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)

  const timerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const generationRef = useRef(0)
  const latestRatesRef = useRef<LiveRates>({})
  const pendingVersionRef = useRef(0)
  const lastAttemptedVersionRef = useRef(0)
  const lastProcessedVersionRef = useRef(0)
  const lastFlushAtRef = useRef(0)

  useEffect(() => {
    latestRatesRef.current = liveRates
  }, [liveRates])

  useEffect(() => {
    generationRef.current += 1
    pendingVersionRef.current = 0
    lastAttemptedVersionRef.current = 0
    lastProcessedVersionRef.current = 0
    lastFlushAtRef.current = 0
    inFlightRef.current = false

    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    setSeries({})
    setPricedRates({})
    setIsSyncing(false)
    setSyncError(null)
    setLastUpdatedAt(null)
  }, [exchangeId])

  useEffect(() => {
    if (!exchangeId || messageCount === 0) return

    pendingVersionRef.current = messageCount
    if (timerRef.current != null || inFlightRef.current) return

    const elapsed = Date.now() - lastFlushAtRef.current
    const delay =
      lastFlushAtRef.current === 0 ? 0 : Math.max(0, GRAPH_UPDATE_INTERVAL_MS - elapsed)

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      void flushPending()
    }, delay)
  }, [exchangeId, messageCount])

  async function flushPending() {
    if (!exchangeId || inFlightRef.current) return
    if (pendingVersionRef.current <= lastAttemptedVersionRef.current) return

    const sampledRates = latestRatesRef.current
    if (Object.keys(sampledRates).length === 0) return

    const generation = generationRef.current
    const sampledVersion = pendingVersionRef.current
    const sampleAt = Date.now()

    lastAttemptedVersionRef.current = sampledVersion
    lastFlushAtRef.current = sampleAt
    inFlightRef.current = true
    setIsSyncing(true)
    setSyncError(null)

    try {
      const response = await getPricedRates(exchangeId)

      if (generationRef.current !== generation) return

      setPricedRates(response.rates)
      setSeries((current) => appendPoint(current, sampledRates, response.rates, sampleAt))
      setLastUpdatedAt(sampleAt)
      lastProcessedVersionRef.current = sampledVersion
    } catch (error) {
      if (generationRef.current === generation) {
        setSyncError(normalizeApiError(error).message)
      }
    } finally {
      if (generationRef.current === generation) {
        inFlightRef.current = false
        setIsSyncing(false)

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
  }

  return {
    series,
    pricedRates,
    isSyncing,
    syncError,
    lastUpdatedAt,
    hasBufferedUpdates: pendingVersionRef.current > lastProcessedVersionRef.current,
  }
}
