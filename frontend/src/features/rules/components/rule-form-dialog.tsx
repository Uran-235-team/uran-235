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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Rule, RuleInput, RuleStatus, RuleType } from '@/entities/rule/types'

const ruleFormSchema = z.object({
  name: z.string().min(2, 'Название правила обязательно.'),
  type: z.enum(['threshold', 'volatility', 'spread', 'schedule']),
  parametersSummary: z.string().min(4, 'Добавьте хотя бы короткое описание параметров.'),
  description: z.string().min(4, 'Добавьте краткое описание.'),
  status: z.enum(['active', 'draft', 'disabled']),
})

const initialValues: RuleInput = {
  name: '',
  type: 'threshold',
  parametersSummary: '',
  description: '',
  status: 'draft',
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
  const form = useForm<z.infer<typeof ruleFormSchema>>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(
      initialRule
        ? {
            name: initialRule.name,
            type: initialRule.type,
            parametersSummary: initialRule.parametersSummary,
            description: initialRule.description,
            status: initialRule.status,
          }
        : initialValues,
    )
  }, [form, initialRule, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {initialRule ? 'Редактирование правила' : 'Создание правила'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Backend endpoints для правил еще в планах, поэтому это окно уже работает на финальном UI-контракте, но пока через временное хранилище-заглушку.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="rule-name">Название правила</Label>
            <Input
              id="rule-name"
              className="border-white/10 bg-white/5"
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-rose-300">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) =>
                  form.setValue('type', value as RuleType, { shouldValidate: true })
                }
              >
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">Порог</SelectItem>
                  <SelectItem value="volatility">Волатильность</SelectItem>
                  <SelectItem value="spread">Спред</SelectItem>
                  <SelectItem value="schedule">Расписание</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) =>
                  form.setValue('status', value as RuleStatus, { shouldValidate: true })
                }
              >
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активно</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="disabled">Отключено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-parameters">Параметры</Label>
            <Textarea
              id="rule-parameters"
              rows={3}
              className="border-white/10 bg-white/5"
              placeholder="Например: alert выше 1.0850, cooldown 15m"
              {...form.register('parametersSummary')}
            />
            {form.formState.errors.parametersSummary ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.parametersSummary.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-description">Описание</Label>
            <Textarea
              id="rule-description"
              rows={4}
              className="border-white/10 bg-white/5"
              {...form.register('description')}
            />
            {form.formState.errors.description ? (
              <p className="text-xs text-rose-300">
                {form.formState.errors.description.message}
              </p>
            ) : null}
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
              {initialRule ? 'Сохранить изменения' : 'Создать правило'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
