import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import type { Rule, RuleInput } from '@/entities/rule/types'

const decimalString = z
  .string()
  .min(1, 'Обязательное поле')
  .refine((value) => /^\d+(\.\d+)?$/.test(value), 'Введите положительное число')
  .refine((value) => Number(value) > 0, 'Должно быть больше нуля')

const ruleFormSchema = z
  .object({
    title: z.string().min(1, 'Название обязательно').max(64),
    extra: z.coerce.number().int('Целое число').positive('Должно быть > 0'),
    low: decimalString,
    high: decimalString,
  })
  .refine((values) => Number(values.high) > Number(values.low), {
    path: ['high'],
    message: 'high должно быть больше low',
  })

type FormValues = z.input<typeof ruleFormSchema>

const initialValues: FormValues = {
  title: '',
  extra: 1,
  low: '',
  high: '',
}

export function RuleFormDialog({
  open,
  onOpenChange,
  initialRule,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRule?: Rule | null
  onSubmit: (values: RuleInput) => void
  isPending: boolean
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (!open) return

    form.reset(
      initialRule
        ? {
            title: initialRule.title,
            extra: initialRule.extra,
            low: initialRule.low,
            high: initialRule.high,
          }
        : initialValues,
    )
  }, [form, initialRule, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {initialRule ? 'Редактирование условия' : 'Создание условия'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Условие описывает диапазон цены и процент наценки. Затем эти условия включаются в
            правила на отдельной странице.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) =>
            onSubmit({
              title: values.title,
              extra: Number(values.extra),
              low: values.low,
              high: values.high,
            }),
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="rule-title">Название</Label>
            <Input
              id="rule-title"
              className="border-white/10 bg-white/5"
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-rose-300">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rule-extra">Наценка, %</Label>
              <Input
                id="rule-extra"
                type="number"
                min={1}
                step={1}
                className="border-white/10 bg-white/5"
                {...form.register('extra')}
              />
              {form.formState.errors.extra ? (
                <p className="text-xs text-rose-300">{form.formState.errors.extra.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-low">От</Label>
              <Input
                id="rule-low"
                inputMode="decimal"
                placeholder="0.00"
                className="border-white/10 bg-white/5"
                {...form.register('low')}
              />
              {form.formState.errors.low ? (
                <p className="text-xs text-rose-300">{form.formState.errors.low.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-high">До</Label>
              <Input
                id="rule-high"
                inputMode="decimal"
                placeholder="0.00"
                className="border-white/10 bg-white/5"
                {...form.register('high')}
              />
              {form.formState.errors.high ? (
                <p className="text-xs text-rose-300">{form.formState.errors.high.message}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-300"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              disabled={isPending}
            >
              {initialRule ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
