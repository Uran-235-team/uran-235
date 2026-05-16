import { useEffect, useState } from 'react'

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

  useEffect(() => {
    if (open) setSelected('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Привязать правило</DialogTitle>
          <DialogDescription className="text-slate-400">
            Backend проверит, что интервалы цен не пересекаются с уже связанными правилами в этом наборе.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Правило</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="border-white/10 bg-white/5">
              <SelectValue placeholder="Выберите правило" />
            </SelectTrigger>
            <SelectContent>
              {candidates.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  Нет правил, которые можно привязать
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
            Привязать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
