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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Exchange } from '@/entities/exchange/types'
import type { RuleAssignment } from '@/entities/rule-assignment/types'
import type { RuleSet } from '@/entities/rule-set/types'

const ANY_EXCHANGE = '__any_exchange__'

function describeScope(assignment: RuleAssignment | null) {
  if (!assignment) return null

  const exchange = assignment.exchangeId ?? 'Любая биржа'
  const currency = assignment.currency ?? 'Любая валюта'
  return `${exchange} / ${currency}`
}

export function RuleAssignmentDialog({
  open,
  onOpenChange,
  initialAssignment,
  ruleSets,
  exchanges,
  defaultRuleSetId,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAssignment: RuleAssignment | null
  ruleSets: RuleSet[]
  exchanges: Exchange[]
  defaultRuleSetId: number | null
  isPending: boolean
  onSubmit: (values: {
    exchangeId: string | null
    currency: string | null
    ruleSetId: number
  }) => void
}) {
  const [exchangeValue, setExchangeValue] = useState(ANY_EXCHANGE)
  const [currencyValue, setCurrencyValue] = useState('')
  const [ruleSetValue, setRuleSetValue] = useState('')

  useEffect(() => {
    if (!open) return

    setExchangeValue(initialAssignment?.exchangeId ?? ANY_EXCHANGE)
    setCurrencyValue(initialAssignment?.currency ?? '')
    setRuleSetValue(String(initialAssignment?.ruleSetId ?? defaultRuleSetId ?? ''))
  }, [defaultRuleSetId, initialAssignment, open])

  const isEditing = initialAssignment != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {isEditing ? 'Изменить назначение' : 'Создать назначение'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? 'Сейчас backend позволяет менять у назначения набор правил, а область действия остаётся неизменной.'
              : 'Назначьте набор правил на конкретную биржу, валюту или на более общий scope.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <Label>Область действия</Label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {describeScope(initialAssignment)}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Биржа</Label>
                <Select value={exchangeValue} onValueChange={setExchangeValue}>
                  <SelectTrigger className="h-11 w-full border-white/10 bg-white/5">
                    <SelectValue placeholder="Любая биржа" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_EXCHANGE}>Любая биржа</SelectItem>
                    {exchanges.map((exchange) => (
                      <SelectItem key={exchange.id} value={exchange.id}>
                        {exchange.title} ({exchange.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Input
                  id="currency"
                  value={currencyValue}
                  onChange={(event) => setCurrencyValue(event.target.value.toUpperCase())}
                  placeholder="Например, USD. Оставьте пустым для любой валюты"
                  className="h-11 border-white/10 bg-white/5"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Набор правил</Label>
            <Select value={ruleSetValue} onValueChange={setRuleSetValue}>
              <SelectTrigger className="h-11 w-full border-white/10 bg-white/5">
                <SelectValue placeholder="Выберите набор" />
              </SelectTrigger>
              <SelectContent>
                {ruleSets.map((ruleSet) => (
                  <SelectItem key={ruleSet.id} value={String(ruleSet.id)}>
                    {ruleSet.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            disabled={isPending || !ruleSetValue}
            onClick={() =>
              onSubmit({
                exchangeId: isEditing
                  ? initialAssignment.exchangeId
                  : exchangeValue === ANY_EXCHANGE
                    ? null
                    : exchangeValue,
                currency: isEditing ? initialAssignment.currency : currencyValue.trim() || null,
                ruleSetId: Number(ruleSetValue),
              })
            }
          >
            {isEditing ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
