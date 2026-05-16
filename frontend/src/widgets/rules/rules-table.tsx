import { PencilLine, Plus, Trash2 } from 'lucide-react'

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
import { formatDecimal } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'

export function RulesTable({
  rules,
  onCreate,
  onEdit,
  onDelete,
}: {
  rules: Rule[]
  onCreate: () => void
  onEdit: (rule: Rule) => void
  onDelete: (ruleId: number) => void
}) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Правила</p>
          <CardTitle className="font-heading text-2xl text-white">
            Интервалы цен и параметры
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
            description="Создайте первое правило — интервал цены [low, high] и параметр extra."
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
                  <TableHead className="text-slate-400">Название</TableHead>
                  <TableHead className="text-slate-400">Extra</TableHead>
                  <TableHead className="text-slate-400">Low</TableHead>
                  <TableHead className="text-slate-400">High</TableHead>
                  <TableHead className="text-right text-slate-400">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="border-white/8 hover:bg-white/5">
                    <TableCell>
                      <p className="font-heading text-base font-semibold text-white">
                        {rule.title}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-300">{rule.extra}</TableCell>
                    <TableCell className="text-slate-300">{formatDecimal(rule.low)}</TableCell>
                    <TableCell className="text-slate-300">{formatDecimal(rule.high)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
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
