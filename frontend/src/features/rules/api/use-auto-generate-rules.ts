import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ruleAssignmentsQueryKey } from '@/features/rule-assignments/api/use-rule-assignments'
import { ruleSetsQueryKey } from '@/features/rule-sets/api/use-rule-sets'
import { rulesQueryKey } from '@/features/rules/api/use-rules'
import { autoGenerateRules } from '@/services/api/auto-rules-api'

export function useAutoGenerateRulesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: autoGenerateRules,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rulesQueryKey }),
        queryClient.invalidateQueries({ queryKey: ruleSetsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ruleAssignmentsQueryKey }),
      ])

      if (result.created_rules === 0) {
        toast.warning(
          result.exchanges === 0
            ? 'Подключённых бирж нет, поэтому ИИ-правила не созданы.'
            : 'Не нашлось подходящих курсов для генерации ИИ-правил.',
        )
        return
      }

      toast.success(
        `ИИ создал ${result.created_rules} правил на ${result.exchanges} биржах${
          result.skipped_currencies > 0 ? `, пропущено ${result.skipped_currencies}.` : '.'
        }`,
      )
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось загрузить ИИ-правила.',
      )
    },
  })
}

