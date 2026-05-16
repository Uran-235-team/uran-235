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
    <Card className="uran-panel border-[rgba(186,255,225,0.22)] shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="uran-kicker">Условия</p>
          <CardTitle className="font-heading text-[1.8rem] font-medium uppercase tracking-[0.08em] text-white">
            Список условий
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          className="h-11 rounded-[0.9rem] border border-[rgba(238,255,255,0.78)] bg-[rgba(10,24,29,0.32)] px-4 text-[#f7ffff] hover:translate-x-1 hover:bg-[#203638] hover:text-[#7df4ef]"
          onClick={onCreate}
        >
          <Plus className="size-4" />
          Создать условие
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <EmptyState
            title="Условий пока нет"
            description="Создайте первое условие: диапазон цены и процент наценки."
            action={
              <Button
                variant="ghost"
                className="h-11 rounded-[0.9rem] border border-[rgba(238,255,255,0.78)] bg-[rgba(10,24,29,0.32)] px-4 text-[#f7ffff] hover:translate-x-1 hover:bg-[#203638] hover:text-[#7df4ef]"
                onClick={onCreate}
              >
                <Plus className="size-4" />
                Создать условие
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[0.9rem] border border-[rgba(209,255,226,0.12)]">
            <Table>
              <TableHeader className="bg-[linear-gradient(90deg,rgba(116,239,159,0.12),rgba(116,239,159,0.03))]">
                <TableRow className="border-[rgba(209,255,226,0.12)] hover:bg-transparent">
                  <TableHead className="h-15 text-white">Название</TableHead>
                  <TableHead className="text-white">Наценка</TableHead>
                  <TableHead className="text-white">От</TableHead>
                  <TableHead className="text-white">До</TableHead>
                  <TableHead className="text-right text-white">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className="border-[rgba(209,255,226,0.1)] hover:bg-[rgba(125,242,154,0.055)]"
                  >
                    <TableCell>
                      <p className="font-heading text-base font-medium text-white">{rule.title}</p>
                    </TableCell>
                    <TableCell className="font-mono text-slate-300">{rule.extra}%</TableCell>
                    <TableCell className="font-mono text-slate-300">
                      {formatDecimal(rule.low)}
                    </TableCell>
                    <TableCell className="font-mono text-slate-300">
                      {formatDecimal(rule.high)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full border border-white/90 bg-[#f7fbfc] text-slate-800 hover:bg-white"
                          onClick={() => onEdit(rule)}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full border border-white/90 bg-[#f7fbfc] text-rose-500 hover:bg-white"
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
