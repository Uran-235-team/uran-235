import { useMemo, useState } from 'react'

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CurrencyChartSeries, LiveRates, PricedRates } from '@/entities/exchange/types'
import { formatDecimal } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'
import { StatusPill } from '@/shared/ui/status-pill'

type Status = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

const statusLabel: Record<Status, { tone: 'active' | 'watch' | 'alert' | 'inactive'; text: string }> = {
  idle: { tone: 'inactive', text: 'Выберите биржу' },
  connecting: { tone: 'watch', text: 'Подключение' },
  open: { tone: 'active', text: 'Live' },
  closed: { tone: 'inactive', text: 'Отключено' },
  error: { tone: 'alert', text: 'Ошибка' },
}

function formatClock(timestamp: number | null) {
  if (timestamp == null) return 'ещё не обновлялся'

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

function CurrencySparkline({ points }: { points: CurrencyChartSeries[string] | undefined }) {
  if (!points || points.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/70 text-xs text-slate-500">
        Ждём хотя бы две точки графика
      </div>
    )
  }

  return (
    <div className="h-24 rounded-2xl border border-white/10 bg-slate-950/70 px-2 py-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 0, bottom: 8, left: 0 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            cursor={false}
            labelFormatter={(value) => formatClock(typeof value === 'number' ? value : Number(value))}
            formatter={(value, name) => {
              const numericValue =
                typeof value === 'number'
                  ? value
                  : typeof value === 'string'
                    ? Number(value)
                    : null

              if (numericValue == null || !Number.isFinite(numericValue)) return ['-', name]
              return [formatDecimal(numericValue), name === 'raw' ? 'Эталон' : 'С формулой']
            }}
            contentStyle={{
              borderRadius: 16,
              border: '1px solid rgba(148, 163, 184, 0.16)',
              background: 'rgba(2, 6, 23, 0.95)',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="raw"
            name="raw"
            dot={false}
            stroke="#67e8f9"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="final"
            name="final"
            dot={false}
            connectNulls
            stroke="#fbbf24"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RatesCard({
  exchangeTitle,
  rates,
  status,
  series,
  pricedRates,
  isSyncing,
  syncError,
  lastUpdatedAt,
  hasBufferedUpdates,
}: {
  exchangeTitle: string | null
  rates: LiveRates
  status: Status
  series: CurrencyChartSeries
  pricedRates: PricedRates
  isSyncing: boolean
  syncError: string | null
  lastUpdatedAt: number | null
  hasBufferedUpdates: boolean
}) {
  const [filter, setFilter] = useState('')

  const entries = useMemo(() => {
    const query = filter.trim().toUpperCase()

    return Object.entries(rates)
      .filter(([code]) => !query || code.includes(query))
      .sort(([a], [b]) => a.localeCompare(b))
  }, [rates, filter])

  const label = statusLabel[status]

  return (
    <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 backdrop-blur-2xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live-курсы</p>
          <CardTitle className="font-heading text-2xl text-white">
            {exchangeTitle ?? 'Биржа не выбрана'}
          </CardTitle>
          <p className="text-sm text-slate-400">
            Графики обновляются по входящим WS-тиккам, но не чаще одного раза в секунду.
          </p>
        </div>
        <div className="space-y-2 text-right">
          <div className="flex justify-end">
            <StatusPill tone={label.tone}>{label.text}</StatusPill>
          </div>
          <p className="text-xs text-slate-500">
            Последний сэмпл: {formatClock(lastUpdatedAt)}
          </p>
          <p
            className={
              syncError
                ? 'text-xs text-rose-300'
                : isSyncing || hasBufferedUpdates
                  ? 'text-xs text-cyan-200'
                  : 'text-xs text-slate-500'
            }
          >
            {syncError
              ? `Ошибка расчёта: ${syncError}`
              : isSyncing
                ? 'Собираем следующую точку графика'
                : hasBufferedUpdates
                  ? 'Есть новые WS-данные в буфере'
                  : 'Графики синхронизированы'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Фильтр по валюте (например, USD)"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-11 border-white/10 bg-white/5"
        />
        {entries.length === 0 ? (
          <EmptyState
            title="Курсов пока нет"
            description={
              status === 'open'
                ? 'Эмулятор ещё не прислал котировки — подождите следующий тик.'
                : 'Подключитесь к бирже, чтобы увидеть live-курсы.'
            }
          />
        ) : (
          <div className="space-y-3">
            {entries.map(([code, rawValue]) => {
              const priced = pricedRates[code]

              return (
                <div
                  key={code}
                  className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[0.8fr_1fr_1fr_1.8fr]"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-semibold tracking-[0.2em] text-white">
                      {code}
                    </p>
                    <p className="text-xs text-slate-500">
                      {priced?.matched
                        ? `Набор #${priced.ruleSetId ?? '—'}`
                        : 'Правило не подобрано'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Эталон</p>
                    <p className="font-mono text-base text-cyan-200">{formatDecimal(rawValue)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      С формулой
                    </p>
                    <p className="font-mono text-base text-amber-200">
                      {priced ? formatDecimal(priced.final) : '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Extra {priced?.extraPct != null ? `${priced.extraPct}%` : '—'}
                    </p>
                  </div>
                  <CurrencySparkline points={series[code]} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
