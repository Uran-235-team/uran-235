import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Exchange } from '@/entities/exchange/types'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/shared/ui/empty-state'

export function ExchangesCard({
  exchanges,
  isLoading,
  selectedExchangeId,
  onSelect,
}: {
  exchanges: Exchange[] | undefined
  isLoading: boolean
  selectedExchangeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 backdrop-blur-2xl">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Подключённые биржи</p>
        <CardTitle className="font-heading text-2xl text-white">Источники курсов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : !exchanges || exchanges.length === 0 ? (
          <EmptyState
            title="Эмуляторы не подключены"
            description="Запустите сервис emulator — он зарегистрируется через WS-ingest и появится здесь."
          />
        ) : (
          <ul className="space-y-2">
            {exchanges.map((exchange) => {
              const isSelected = exchange.id === selectedExchangeId
              return (
                <li key={exchange.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(exchange.id)}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3 text-left transition',
                      isSelected
                        ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
                    )}
                  >
                    <p className="text-sm font-semibold">{exchange.title}</p>
                    <p className="font-mono text-xs text-slate-400">{exchange.id}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
