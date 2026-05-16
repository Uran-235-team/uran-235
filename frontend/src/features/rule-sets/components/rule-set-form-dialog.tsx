import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RuleSet, RuleSetInput } from '@/entities/rule-set/types'

const schema = z.object({
  title: z.string().min(1, 'Название обязательно').max(64),
})

export function RuleSetFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: RuleSet | null
  onSubmit: (values: RuleSetInput) => void
  isPending: boolean
}) {
  const form = useForm<RuleSetInput>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ title: initial?.title ?? '' })
  }, [form, initial, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {initial ? 'Переименовать набор' : 'Создать набор правил'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="rule-set-title">Название</Label>
            <Input
              id="rule-set-title"
              className="border-white/10 bg-white/5"
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-rose-300">{form.formState.errors.title.message}</p>
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
              {initial ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
