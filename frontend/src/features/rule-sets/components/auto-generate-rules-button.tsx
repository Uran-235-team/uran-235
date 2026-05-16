import { useState } from 'react'

import { Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAutoGenerateRulesMutation } from '@/features/rules/api/use-auto-generate-rules'

type AutoGenerateRulesButtonProps = {
  onSuccess?: () => void
}

export function AutoGenerateRulesButton({ onSuccess }: AutoGenerateRulesButtonProps) {
  const [open, setOpen] = useState(false)
  const mutation = useAutoGenerateRulesMutation()

  return (
    <>
      <button
        type="button"
        className="formula-button magnetic"
        disabled={mutation.isPending}
        onClick={() => setOpen(true)}
        aria-label="Загрузить ИИ-правила"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Загрузить ИИ-правила
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перезагрузить правила через ИИ?</DialogTitle>
            <DialogDescription>
              Текущие условия, наборы и назначения будут удалены и заменены на автоматически
              сгенерированные правила по актуальным курсам подключённых бирж.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={() => {
                mutation.mutate(undefined, {
                  onSuccess: () => {
                    setOpen(false)
                    onSuccess?.()
                  },
                })
              }}
            >
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Заменить на ИИ-правила
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

