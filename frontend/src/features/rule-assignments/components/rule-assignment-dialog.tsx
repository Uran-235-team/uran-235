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

function describeScope(assignment: RuleAssignment | null) {
  if (!assignment) return null

  const exchange = assignment.exchangeId ?? 'Любая биржа'
  const currency = assignment.currency ?? 'Любая валюта'
  return `${exchange} / ${currency}`
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
  }) => void
}) {
  const isEditing = initialAssignment != null
  const currencySuggestions = useCurrencySuggestionsStore((state) => state.seenCurrencies)

  const [exchangeValue, setExchangeValue] = useState(initialAssignment?.exchangeId ?? ANY_EXCHANGE)
  const [currencyValue, setCurrencyValue] = useState(initialAssignment?.currency ?? '')
  const [ruleSetValue, setRuleSetValue] = useState(
    String(initialAssignment?.ruleSetId ?? defaultRuleSetId ?? ''),
  )

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
              ? 'Текущий backend позволяет менять только само правило, а область действия остаётся неизменной.'
              : 'Назначьте правило на конкретную биржу, валюту или на более общий уровень.'}
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
