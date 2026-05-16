import { PencilLine, Plus, Power, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Rule } from '@/entities/rule/types'
import { formatDateTime } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'
import { StatusPill } from '@/shared/ui/status-pill'

export function RulesTable({
  rules,
  onCreate,
  onEdit,
  onDelete,
  onToggle,
}: {
  rules: Rule[]
  onCreate: () => void
  onEdit: (rule: Rule) => void
  onDelete: (ruleId: string) => void
  onToggle: (ruleId: string) => void
}) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Страница правил</p>
          <CardTitle className="font-heading text-2xl text-white">
            Матрица стратегий
          </CardTitle>
        </div>
        <Button
          className="h-11 rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          onClick={onCreate}
        >
          <Plus className="size-4" />
          Создать правило
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <EmptyState
            title="Правил пока нет"
            description="Создайте первое правило, чтобы подготовить будущий backend rule engine к работе с dashboard."
            action={
              <Button
                className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                onClick={onCreate}
              >
                <Plus className="size-4" />
                Создать правило
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-slate-400">Название правила</TableHead>
                  <TableHead className="text-slate-400">Тип</TableHead>
                  <TableHead className="text-slate-400">Параметры</TableHead>
                  <TableHead className="text-slate-400">Создано</TableHead>
                  <TableHead className="text-slate-400">Статус</TableHead>
                  <TableHead className="text-right text-slate-400">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="border-white/8 hover:bg-white/5">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-heading text-base font-semibold text-white">
                          {rule.name}
                        </p>
                        <p className="max-w-sm text-sm text-slate-400">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-slate-300">
                      {rule.type === 'threshold'
                        ? 'Порог'
                        : rule.type === 'volatility'
                          ? 'Волатильность'
                          : rule.type === 'spread'
                            ? 'Спред'
                            : 'Расписание'}
                    </TableCell>
                    <TableCell className="max-w-sm text-sm text-slate-300">
                      {rule.parametersSummary}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {formatDateTime(rule.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={rule.status}>
                        {rule.status === 'active'
                          ? 'Активно'
                          : rule.status === 'draft'
                            ? 'Черновик'
                            : 'Отключено'}
                      </StatusPill>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-xl border border-white/10 bg-white/5"
                          onClick={() => onToggle(rule.id)}
                        >
                          <Power className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-xl border border-white/10 bg-white/5"
                          onClick={() => onEdit(rule)}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-xl border border-white/10 bg-white/5"
                          onClick={() => onDelete(rule.id)}
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
        )}
      </CardContent>
    </Card>
  )
}
