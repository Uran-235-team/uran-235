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
import { useCurrencySuggestionsStore } from '@/features/exchanges/model/currency-suggestions-store'
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

function AssignmentDialogFields({
  initialAssignment,
  ruleSets,
  exchanges,
  defaultRuleSetId,
  isPending,
  onRefreshExchanges,
  onClose,
  onSubmit,
}: {
  initialAssignment: RuleAssignment | null
  ruleSets: RuleSet[]
  exchanges: Exchange[]
  defaultRuleSetId: number | null
  isPending: boolean
  onRefreshExchanges?: () => void
  onClose: () => void
  onSubmit: (values: {
    exchangeId: string | null
    currency: string | null
    ruleSetId: number
    validFrom: string
    validTo: string
  }) => void
}) {
  const isEditing = initialAssignment != null
  const currencySuggestions = useCurrencySuggestionsStore((state) => state.seenCurrencies)

  const [exchangeValue, setExchangeValue] = useState(initialAssignment?.exchangeId ?? ANY_EXCHANGE)
  const [currencyValue, setCurrencyValue] = useState(initialAssignment?.currency ?? '')
  const [ruleSetValue, setRuleSetValue] = useState(
    String(initialAssignment?.ruleSetId ?? defaultRuleSetId ?? ''),
  )
  const [validFromValue, setValidFromValue] = useState(initialAssignment?.validFrom ?? '01.01')
  const [validToValue, setValidToValue] = useState(initialAssignment?.validTo ?? '31.12')

  const datesValid = isValidDdMm(validFromValue) && isValidDdMm(validToValue)

  return (
    <>
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
                <SelectTrigger
                  className="h-11 w-full border-white/10 bg-white/5"
                  onClick={() => onRefreshExchanges?.()}
                >
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
                list="currency-suggestions"
                placeholder="Например, USD. Оставьте пустым для любой валюты"
                className="h-11 border-white/10 bg-white/5"
              />
              <datalist id="currency-suggestions">
                {currencySuggestions.map((code) => (
                  <option key={code} value={code} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500">
                Подсказки формируются по валютам, которые уже приходили по WebSocket.
              </p>
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
          <Label>Правило</Label>
          <Select value={ruleSetValue} onValueChange={setRuleSetValue}>
            <SelectTrigger className="h-11 w-full border-white/10 bg-white/5">
              <SelectValue placeholder="Выберите правило" />
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
        <Button type="button" variant="ghost" className="text-slate-300" onClick={onClose}>
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
    </>
  )
}

export function RuleAssignmentDialog({
  open,
  onOpenChange,
  initialAssignment,
  ruleSets,
  exchanges,
  defaultRuleSetId,
  isPending,
  onRefreshExchanges,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAssignment: RuleAssignment | null
  ruleSets: RuleSet[]
  exchanges: Exchange[]
  defaultRuleSetId: number | null
  isPending: boolean
  onRefreshExchanges?: () => void
  onSubmit: (values: {
    exchangeId: string | null
    currency: string | null
    ruleSetId: number
    validFrom: string
    validTo: string
  }) => void
}) {
  const isEditing = initialAssignment != null

  useEffect(() => {
    if (open) onRefreshExchanges?.()
  }, [onRefreshExchanges, open])

  const contentKey = `${isEditing ? `edit-${initialAssignment?.id}` : 'create'}-${defaultRuleSetId ?? 'none'}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {isEditing ? 'Изменить назначение' : 'Создать назначение правила'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? 'Можно изменить набор правил и период действия. Биржа и валюта остаются неизменными.'
              : 'Назначьте правило на биржу и валюту. Правило действует только в указанном периоде (ДД.ММ, каждый год).'}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <AssignmentDialogFields
            key={contentKey}
            initialAssignment={initialAssignment}
            ruleSets={ruleSets}
            exchanges={exchanges}
            defaultRuleSetId={defaultRuleSetId}
            isPending={isPending}
            onRefreshExchanges={onRefreshExchanges}
            onClose={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
