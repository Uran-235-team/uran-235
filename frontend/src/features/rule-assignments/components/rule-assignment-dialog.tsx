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
const DD_MM_RE = /^(\d{1,2})\.(\d{1,2})$/

function describeScope(assignment: RuleAssignment | null) {
  if (!assignment) return null

  const exchange = assignment.exchangeId ?? 'Любая биржа'
  const currency = assignment.currency ?? 'Любая валюта'
  return `${exchange} / ${currency}`
}

function isValidDdMm(value: string) {
  const match = value.trim().match(DD_MM_RE)
  if (!match) return false
  const day = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(2000, month, 0).getDate()
  return day >= 1 && day <= daysInMonth
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
    validFrom: string
    validTo: string
  }) => void
}) {
  const [exchangeValue, setExchangeValue] = useState(ANY_EXCHANGE)
  const [currencyValue, setCurrencyValue] = useState('')
  const [ruleSetValue, setRuleSetValue] = useState('')
  const [validFromValue, setValidFromValue] = useState('01.01')
  const [validToValue, setValidToValue] = useState('31.12')

  useEffect(() => {
    if (!open) return

    setExchangeValue(initialAssignment?.exchangeId ?? ANY_EXCHANGE)
    setCurrencyValue(initialAssignment?.currency ?? '')
    setRuleSetValue(String(initialAssignment?.ruleSetId ?? defaultRuleSetId ?? ''))
    setValidFromValue(initialAssignment?.validFrom ?? '01.01')
    setValidToValue(initialAssignment?.validTo ?? '31.12')
  }, [defaultRuleSetId, initialAssignment, open])

  const isEditing = initialAssignment != null
  const datesValid = isValidDdMm(validFromValue) && isValidDdMm(validToValue)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {isEditing ? 'Изменить назначение' : 'Создать назначение'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? 'Можно изменить набор правил и период действия. Биржа и валюта остаются неизменными.'
              : 'Назначьте набор правил на биржу и валюту. Правило действует только в указанном периоде (ДД.ММ, каждый год).'}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valid-from">Действует с (ДД.ММ)</Label>
              <Input
                id="valid-from"
                value={validFromValue}
                onChange={(event) => setValidFromValue(event.target.value)}
                placeholder="01.06"
                className="h-11 border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-to">Действует по (ДД.ММ)</Label>
              <Input
                id="valid-to"
                value={validToValue}
                onChange={(event) => setValidToValue(event.target.value)}
                placeholder="31.08"
                className="h-11 border-white/10 bg-white/5"
              />
            </div>
          </div>
          {!datesValid ? (
            <p className="text-sm text-amber-300/90">
              Укажите даты в формате ДД.ММ, например 15.11 или 01.03.
            </p>
          ) : null}

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
            disabled={isPending || !ruleSetValue || !datesValid}
            onClick={() =>
              onSubmit({
                exchangeId: isEditing
                  ? initialAssignment.exchangeId
                  : exchangeValue === ANY_EXCHANGE
                    ? null
                    : exchangeValue,
                currency: isEditing ? initialAssignment.currency : currencyValue.trim() || null,
                ruleSetId: Number(ruleSetValue),
                validFrom: validFromValue.trim(),
                validTo: validToValue.trim(),
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
