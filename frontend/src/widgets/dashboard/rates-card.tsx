import { useEffect, useMemo, useRef, useState } from 'react'

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CurrencyChartSeries, Exchange, LiveRates, PricedRates } from '@/entities/exchange/types'
import { formatDecimal } from '@/shared/lib/format'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'
const CHART_VISIBILITY_THRESHOLD = 0.2

type CurrencyMeta = {
  symbol: string
  name: string
  flag: string | null
}

const CURRENCY_META: Record<string, CurrencyMeta> = {
  EUR: { symbol: '€', name: 'Euro', flag: 'eu' },
  USD: { symbol: '$', name: 'US Dollar', flag: 'us' },
  CNY: { symbol: '¥', name: 'Yuan', flag: 'cn' },
  JPY: { symbol: '¥', name: 'Yen', flag: 'jp' },
  GBP: { symbol: '£', name: 'Pound', flag: 'gb' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', flag: 'ch' },
  TRY: { symbol: '₺', name: 'Lira', flag: 'tr' },
  INR: { symbol: '₹', name: 'Rupee', flag: 'in' },
  BRL: { symbol: 'R$', name: 'Real', flag: 'br' },
  MXN: { symbol: 'Mex$', name: 'Peso', flag: 'mx' },
  KRW: { symbol: '₩', name: 'Won', flag: 'kr' },
  IDR: { symbol: 'Rp', name: 'Rupiah', flag: 'id' },
  RUB: { symbol: '₽', name: 'Ruble', flag: null },
  BTC: { symbol: '₿', name: 'Bitcoin', flag: 'btc' },
}

function formatClock(timestamp: number | null) {
  if (timestamp == null) return 'ещё не обновлялся'

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

function CurrencyLineChart({
  points,
  isVisible,
}: {
  points: CurrencyChartSeries[string] | undefined
  isVisible: boolean
}) {
  if (!isVisible) {
    return (
      <svg viewBox="0 0 230 64" role="img" aria-label="График вне зоны видимости">
        <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
      </svg>
    )
  }

  if (!points || points.length < 2) {
    return (
      <svg viewBox="0 0 230 64" role="img" aria-label="Нет данных для графика">
        <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
      </svg>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 6, right: 0, bottom: 6, left: 0 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          cursor={false}
          labelFormatter={(value) =>
            formatClock(typeof value === 'number' ? value : Number(value))
          }
          formatter={(value, name) => {
            const numericValue =
              typeof value === 'number'
                ? value
                : typeof value === 'string'
                  ? Number(value)
                  : null

            if (numericValue == null || !Number.isFinite(numericValue)) return ['-', name]
            return [formatDecimal(numericValue), name === 'raw' ? 'RUB' : 'Расчёт']
          }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid rgba(47, 127, 148, 0.18)',
            background: 'rgba(255,255,255,0.96)',
            color: '#26323b',
          }}
        />
        <Line
          type="monotone"
          dataKey="raw"
          stroke="#2f7f94"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="final"
          stroke="#8b70b8"
          strokeWidth={1.6}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function statusText(status: Status) {
  switch (status) {
    case 'connecting':
      return 'Подключение'
    case 'open':
      return 'Live'
    case 'closed':
      return 'Отключено'
    case 'error':
      return 'Ошибка'
    default:
      return 'Выберите биржу'
  }
}

function CurrencyFlag({ code, flag }: { code: string; flag: string | null }) {
  switch (flag) {
    case 'eu':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#244aa5" />
          <g fill="#ffd84d">
            <circle cx="18" cy="5" r="1.1" />
            <circle cx="21.5" cy="6" r="1.1" />
            <circle cx="24" cy="8.8" r="1.1" />
            <circle cx="25" cy="12" r="1.1" />
            <circle cx="24" cy="15.2" r="1.1" />
            <circle cx="21.5" cy="18" r="1.1" />
            <circle cx="18" cy="19" r="1.1" />
            <circle cx="14.5" cy="18" r="1.1" />
            <circle cx="12" cy="15.2" r="1.1" />
            <circle cx="11" cy="12" r="1.1" />
            <circle cx="12" cy="8.8" r="1.1" />
            <circle cx="14.5" cy="6" r="1.1" />
          </g>
        </svg>
      )
    case 'us':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <g fill="#bf2f45">
            <rect y="0" width="36" height="2" />
            <rect y="4" width="36" height="2" />
            <rect y="8" width="36" height="2" />
            <rect y="12" width="36" height="2" />
            <rect y="16" width="36" height="2" />
            <rect y="20" width="36" height="2" />
          </g>
          <rect width="16" height="12" fill="#294a8d" />
          <g fill="#fff">
            <circle cx="3" cy="3" r=".6" />
            <circle cx="7" cy="3" r=".6" />
            <circle cx="11" cy="3" r=".6" />
            <circle cx="5" cy="6" r=".6" />
            <circle cx="9" cy="6" r=".6" />
            <circle cx="13" cy="6" r=".6" />
            <circle cx="3" cy="9" r=".6" />
            <circle cx="7" cy="9" r=".6" />
            <circle cx="11" cy="9" r=".6" />
          </g>
        </svg>
      )
    case 'cn':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#dd2d2d" />
          <path
            fill="#ffd34f"
            d="m8 4 1.2 3.4h3.6L9.9 9.5l1.1 3.4L8 10.8 5 12.9l1.1-3.4-2.9-2.1h3.6z"
          />
          <g fill="#ffd34f">
            <circle cx="16" cy="5" r="1" />
            <circle cx="20" cy="8" r="1" />
            <circle cx="20" cy="13" r="1" />
            <circle cx="16" cy="16" r="1" />
          </g>
        </svg>
      )
    case 'jp':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <circle cx="18" cy="12" r="6.3" fill="#c9324b" />
        </svg>
      )
    case 'gb':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#203b7a" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="5" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#d8424f" strokeWidth="2.6" />
          <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="8" />
          <path d="M18 0v24M0 12h36" stroke="#d8424f" strokeWidth="4.6" />
        </svg>
      )
    case 'ch':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d52f3a" />
          <path fill="#fff" d="M15 5h6v5h5v4h-5v5h-6v-5h-5v-4h5z" />
        </svg>
      )
    case 'tr':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#d62d36" />
          <circle cx="15" cy="12" r="6" fill="#fff" />
          <circle cx="17.2" cy="12" r="4.8" fill="#d62d36" />
          <path
            fill="#fff"
            d="m24 8.2 1 2.5 2.7.2-2.1 1.7.7 2.6-2.3-1.4-2.3 1.4.7-2.6-2.1-1.7 2.7-.2z"
          />
        </svg>
      )
    case 'in':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="8" fill="#f39a3d" />
          <rect y="8" width="36" height="8" fill="#fff" />
          <rect y="16" width="36" height="8" fill="#24935b" />
          <circle cx="18" cy="12" r="3" fill="none" stroke="#31519a" strokeWidth="1" />
          <circle cx="18" cy="12" r=".8" fill="#31519a" />
        </svg>
      )
    case 'br':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#229457" />
          <path fill="#f2d24b" d="M18 3 33 12 18 21 3 12z" />
          <circle cx="18" cy="12" r="5.2" fill="#234b9b" />
        </svg>
      )
    case 'mx':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="12" height="24" fill="#17834f" />
          <rect x="12" width="12" height="24" fill="#fff" />
          <rect x="24" width="12" height="24" fill="#c93a3f" />
          <circle cx="18" cy="12" r="2.2" fill="#9d7440" />
        </svg>
      )
    case 'kr':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" fill="#fff" />
          <path
            d="M18 6a6 6 0 0 1 0 12 3 3 0 0 1 0-6 3 3 0 0 0 0-6Z"
            fill="#d9434b"
          />
          <path
            d="M18 6a3 3 0 0 1 0 6 3 3 0 0 0 0 6 6 6 0 0 1 0-12Z"
            fill="#3158a7"
          />
          <g stroke="#111" strokeWidth="1.2">
            <path d="m7 5 5 3M8 3.5l5 3M6 6.5l5 3M25 16l5 3M24 17.5l5 3M26 14.5l5 3" />
          </g>
        </svg>
      )
    case 'id':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="12" fill="#d9343f" />
          <rect y="12" width="36" height="12" fill="#fff" />
        </svg>
      )
    case 'btc':
      return (
        <svg viewBox="0 0 36 24">
          <rect width="36" height="24" rx="4" fill="#f7931a" />
          <circle cx="18" cy="12" r="7" fill="#fff" />
          <text
            x="18"
            y="15.5"
            fill="#f7931a"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize="10"
            fontWeight="700"
            textAnchor="middle"
          >
            B
          </text>
          <path d="M15.8 7.7v8.6M20.2 7.7v8.6" stroke="#f7931a" strokeWidth="1" />
        </svg>
      )
    default:
      return <strong className="text-xs font-semibold text-slate-200">{code.slice(0, 2)}</strong>
  }
}

function metaForCode(code: string) {
  const known = CURRENCY_META[code]
  if (known) return known

  return {
    symbol: code.slice(0, 1),
    name: code,
    flag: null,
  }
}

export function RatesCard({
  exchanges,
  exchangesLoading,
  onOpenExchangeMenu,
  selectedExchangeId,
  onSelectExchange,
  exchangeTitle,
  rates,
  status,
  series,
  pricedRates,
  onVisibleChartCodesChange,
}: {
  exchanges: Exchange[]
  exchangesLoading: boolean
  onOpenExchangeMenu: () => void
  selectedExchangeId: string | null
  onSelectExchange: (id: string) => void
  exchangeTitle: string | null
  rates: LiveRates
  status: Status
  series: CurrencyChartSeries
  pricedRates: PricedRates
  onVisibleChartCodesChange: (codes: string[]) => void
}) {
  const entries = useMemo(
    () =>
      Object.entries(rates)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([code, rawValue]) => {
          const priced = pricedRates[code]
          return { code, rawValue, priced, meta: metaForCode(code) }
        }),
    [pricedRates, rates],
  )
  const entryCodes = useMemo(() => entries.map(({ code }) => code), [entries])
  const entryCodesKey = entryCodes.join('|')

  const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined'
  const [visibleChartCodes, setVisibleChartCodes] = useState<string[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const chartNodesRef = useRef(new Map<string, HTMLElement>())
  const visibleCodesRef = useRef(new Set<string>())
  const refCallbacksRef = useRef(new Map<string, (node: HTMLElement | null) => void>())

  function getBindChartNode(code: string) {
    let cb = refCallbacksRef.current.get(code)
    if (cb) return cb
    cb = (node: HTMLElement | null) => {
      const prev = chartNodesRef.current.get(code)
      const observer = observerRef.current
      if (prev && observer) observer.unobserve(prev)
      if (node) {
        chartNodesRef.current.set(code, node)
        if (observer) observer.observe(node)
      } else {
        chartNodesRef.current.delete(code)
        if (visibleCodesRef.current.delete(code)) {
          setVisibleChartCodes(Array.from(visibleCodesRef.current))
        }
      }
    }
    refCallbacksRef.current.set(code, cb)
    return cb
  }

  useEffect(() => {
    if (!supportsIntersectionObserver) return

    const observer = new IntersectionObserver(
      (observerEntries) => {
        let changed = false
        for (const observerEntry of observerEntries) {
          const code = observerEntry.target.getAttribute('data-currency-code')
          if (!code) continue
          if (observerEntry.isIntersecting) {
            if (!visibleCodesRef.current.has(code)) {
              visibleCodesRef.current.add(code)
              changed = true
            }
          } else if (visibleCodesRef.current.delete(code)) {
            changed = true
          }
        }
        if (changed) setVisibleChartCodes(Array.from(visibleCodesRef.current))
      },
      { threshold: CHART_VISIBILITY_THRESHOLD },
    )
    observerRef.current = observer

    for (const node of chartNodesRef.current.values()) {
      observer.observe(node)
    }

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [supportsIntersectionObserver])

  // Prune visibility state when the set of currencies changes.
  useEffect(() => {
    const currentCodes = new Set(entryCodes)
    let changed = false
    for (const code of Array.from(visibleCodesRef.current)) {
      if (!currentCodes.has(code)) {
        visibleCodesRef.current.delete(code)
        changed = true
      }
    }
    if (changed) setVisibleChartCodes(Array.from(visibleCodesRef.current))
    // entryCodes identity changes every render; depend on a stable key.
  }, [entryCodesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveVisibleChartCodes = supportsIntersectionObserver
    ? visibleChartCodes
    : entryCodes
  const visibleCodesSet = useMemo(
    () => new Set(effectiveVisibleChartCodes),
    [effectiveVisibleChartCodes],
  )

  useEffect(() => {
    onVisibleChartCodesChange(effectiveVisibleChartCodes)
  }, [effectiveVisibleChartCodes, onVisibleChartCodesChange])

  return (
    <>
      <section className="rates-table" aria-labelledby="dashboardTitle">
        <h1 id="dashboardTitle" className="sr-only">
          Таблица курсов
        </h1>
        <div className="table-head">
          <span>Валюта (за единицу)</span>
          <span>RUB</span>
          <span>
            Правила
            <small>{exchangeTitle ?? 'Биржа не выбрана'}</small>
          </span>
          <span>Расчёт</span>
        </div>
        <div className="table-body">
          {entries.length === 0 ? (
            <div className="rate-row">
              <span className="currency-cell text-slate-300">Ожидаем котировки по выбранной бирже</span>
              <span className="rub-cell">—</span>
              <span className="formula-cell">{statusText(status)}</span>
              <span className="result-cell">—</span>
            </div>
          ) : (
            entries.map(({ code, rawValue, priced, meta }) => (
              <div key={code} className="rate-row">
                <span className="currency-cell">
                  <span className="currency-flag" aria-hidden="true">
                    <CurrencyFlag code={code} flag={meta.flag} />
                  </span>
                  <strong className={`currency-symbol${meta.symbol.length > 2 ? ' is-long' : ''}`}>
                    {meta.symbol}
                  </strong>
                  <span className="currency-code">
                    {code}
                    <small>{meta.name}</small>
                  </span>
                </span>
                <span className="rub-cell">{formatDecimal(rawValue)}</span>
                <span className="formula-cell">
                  {priced?.matched
                    ? `Правило #${priced.ruleSetId ?? '—'}`
                    : priced
                      ? 'Без совпадения'
                      : 'Нет назначения'}
                </span>
                <span className="result-cell">
                  {priced ? formatDecimal(priced.final) : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <aside className="chart-panel" aria-label="Изображение графика">
        <div className="panel-title">
          <h2>Графики валют</h2>
          <DropdownMenu onOpenChange={(open) => open && onOpenExchangeMenu()}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 rounded-lg border border-[rgba(179,231,209,0.18)] bg-[#081112] px-3 text-xs text-slate-100 hover:bg-[#0b1717]"
              >
                {exchangesLoading ? 'Обновляем…' : exchangeTitle ?? 'Выбрать биржу'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl border border-[rgba(158,231,159,0.22)] bg-[#0a1515] text-white"
            >
              {exchanges.length === 0 ? (
                <DropdownMenuItem disabled>Биржи пока не подключены</DropdownMenuItem>
              ) : (
                exchanges.map((exchange) => (
                  <DropdownMenuItem
                    key={exchange.id}
                    onSelect={() => onSelectExchange(exchange.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{exchange.title}</span>
                    {selectedExchangeId === exchange.id ? <span>•</span> : null}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="spark-list">
          {entries.length === 0 ? (
            <article className="spark-card">
              <div className="spark-hover-layer" aria-hidden="true" />
              <svg viewBox="0 0 230 64" role="img" aria-label="График отсутствует">
                <path className="spark-grid" d="M0 13H230M0 32H230M0 51H230" />
              </svg>
              <span className="spark-value">
                Нет данных
                <small>Подключите биржу</small>
              </span>
            </article>
          ) : (
            entries.map(({ code, priced }) => (
              <article
                key={code}
                ref={getBindChartNode(code)}
                data-currency-code={code}
                className="spark-card"
              >
                <span className="spark-hover-layer" aria-hidden="true" />
                <div className="h-[52px] w-full">
                  <CurrencyLineChart
                    points={series[code]}
                    isVisible={visibleCodesSet.has(code)}
                  />
                </div>
                <span className="spark-value">
                  {priced ? formatDecimal(priced.final) : '—'}
                  <small>{code}</small>
                </span>
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
