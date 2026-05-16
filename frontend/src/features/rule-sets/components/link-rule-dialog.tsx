import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Rule } from '@/entities/rule/types'
import { formatDecimal } from '@/shared/lib/format'

export function LinkRuleDialog({
  open,
  onOpenChange,
  candidates,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: Rule[]
  onConfirm: (ruleId: number) => void
  isPending: boolean
}) {
  const [selected, setSelected] = useState<string>('')
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelected('')
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Добавить условие в правило</DialogTitle>
          <DialogDescription className="text-slate-400">
            Backend проверит, что диапазоны не пересекаются с уже включёнными условиями этого
            правила.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Условие</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="border-white/10 bg-white/5">
              <SelectValue placeholder="Выберите условие" />
            </SelectTrigger>
            <SelectContent>
              {candidates.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  Нет условий, которые можно добавить
                </SelectItem>
              ) : (
                candidates.map((rule) => (
                  <SelectItem key={rule.id} value={String(rule.id)}>
                    {rule.title} [{formatDecimal(rule.low)} … {formatDecimal(rule.high)}]
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            disabled={isPending || !selected}
            onClick={() => selected && onConfirm(Number(selected))}
          >
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
