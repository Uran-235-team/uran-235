import { useMemo, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { LiveRates } from '@/entities/exchange/types'
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

export function RatesCard({
  exchangeTitle,
  rates,
  status,
}: {
  exchangeTitle: string | null
  rates: LiveRates
  status: Status
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
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live-курсы</p>
          <CardTitle className="font-heading text-2xl text-white">
            {exchangeTitle ?? 'Биржа не выбрана'}
          </CardTitle>
        </div>
        <StatusPill tone={label.tone}>{label.text}</StatusPill>
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(([code, value]) => (
              <div
                key={code}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="font-mono text-sm font-semibold text-white">{code}</span>
                <span className="font-mono text-sm text-cyan-200">{formatDecimal(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
