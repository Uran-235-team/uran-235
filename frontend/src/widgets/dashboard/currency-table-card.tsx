import { useDeferredValue, useMemo, useState } from 'react'

import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CurrencyPair, CurrencyStatus } from '@/entities/currency/types'
import type { Rule } from '@/entities/rule/types'
import { formatCompactNumber, formatPercent, formatRate, formatRelativeTime } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'
import { StatusPill } from '@/shared/ui/status-pill'

type SortKey = 'pair' | 'rate' | 'changePercent' | 'lastUpdated'

const pageSize = 5

export function CurrencyTableCard({
  data,
  rules,
  isLoading,
  selectedPair,
  onSelectPair,
}: {
  data?: CurrencyPair[]
  rules: Rule[]
  isLoading: boolean
  selectedPair: string
  onSelectPair: (pair: string) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CurrencyStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('changePercent')
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(search)

  const filtered = useMemo(() => {
    const prepared = (data ?? [])
      .filter((currency) =>
        currency.pair.toLowerCase().includes(deferredSearch.trim().toLowerCase()),
      )
      .filter((currency) =>
        statusFilter === 'all' ? true : currency.status === statusFilter,
      )
      .sort((left, right) => {
        if (sortBy === 'pair') {
          return left.pair.localeCompare(right.pair)
        }

        if (sortBy === 'lastUpdated') {
          return right.lastUpdated.localeCompare(left.lastUpdated)
        }

        return right[sortBy] - left[sortBy]
      })

    return prepared
  }, [data, deferredSearch, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getRuleName = (ruleId: string | null) =>
    rules.find((rule) => rule.id === ruleId)?.name ?? 'Без правила'

  return (
    <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Таблица валют</p>
          <CardTitle className="font-heading text-2xl text-white">
            Матрица мониторинга
          </CardTitle>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
              placeholder="Поиск пары"
              className="h-11 rounded-2xl border-white/10 bg-white/5 pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setPage(1)
              setStatusFilter(value as typeof statusFilter)
            }}
          >
            <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5">
              <SelectValue placeholder="Фильтр статуса" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="stable">Стабильно</SelectItem>
              <SelectItem value="watch">Наблюдение</SelectItem>
              <SelectItem value="alert">Тревога</SelectItem>
              <SelectItem value="inactive">Неактивно</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="changePercent">Изменение %</SelectItem>
              <SelectItem value="rate">Текущий курс</SelectItem>
              <SelectItem value="pair">Пара</SelectItem>
              <SelectItem value="lastUpdated">Последнее обновление</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl bg-white/6" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Нет пар под эти фильтры"
            description="Измените поиск или статусный фильтр, чтобы показать нужные валюты."
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-slate-400">Пара</TableHead>
                    <TableHead className="text-slate-400">Текущий курс</TableHead>
                    <TableHead className="text-slate-400">Изменение %</TableHead>
                    <TableHead className="text-slate-400">Статус</TableHead>
                    <TableHead className="text-slate-400">Активное правило</TableHead>
                    <TableHead className="text-slate-400">Объем 24ч</TableHead>
                    <TableHead className="text-slate-400">Обновление</TableHead>
                    <TableHead className="text-right text-slate-400">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((currency) => (
                    <TableRow
                      key={currency.id}
                      className={[
                        'cursor-pointer border-white/8 transition hover:bg-white/5',
                        selectedPair === currency.pair ? 'bg-cyan-300/6' : '',
                      ].join(' ')}
                      onClick={() => onSelectPair(currency.pair)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-heading text-base font-semibold text-white">
                            {currency.pair}
                          </p>
                          <p className="text-xs text-slate-500">
                            Спред {currency.spread.toFixed(2)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-200">
                        {formatRate(currency.rate)}
                      </TableCell>
                      <TableCell
                        className={
                          currency.changePercent >= 0
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                        }
                      >
                        {formatPercent(currency.changePercent)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={currency.status}>
                          {currency.status === 'stable'
                            ? 'Стабильно'
                            : currency.status === 'watch'
                              ? 'Наблюдение'
                              : currency.status === 'alert'
                                ? 'Тревога'
                                : 'Неактивно'}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {getRuleName(currency.activeRuleId)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {formatCompactNumber(currency.volume24h)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatRelativeTime(currency.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-xl border border-white/10 bg-white/5"
                            onClick={(event) => {
                              event.stopPropagation()
                              onSelectPair(currency.pair)
                            }}
                          >
                            <ArrowDownUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-xl border border-white/10 bg-white/5"
                            onClick={(event) => {
                              event.stopPropagation()
                              toast.info('Редактирование валюты пока зарезервировано под будущий backend flow управления правилами.')
                            }}
                          >
                            <PencilLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-xl border border-white/10 bg-white/5"
                            onClick={(event) => {
                              event.stopPropagation()
                              toast.info('Удаление пока показано как planned stub до появления backend endpoints.')
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Показано {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, filtered.length)} из {filtered.length} пар
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl border border-white/10 bg-white/5"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-slate-300">
                  {page}/{totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl border border-white/10 bg-white/5"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
