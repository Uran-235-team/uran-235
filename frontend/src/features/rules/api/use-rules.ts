import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RuleInput } from '@/entities/rule/types'
import {
  createRule,
  deleteRule,
  listRules,
  toggleRuleStatus,
  updateRule,
} from '@/services/repositories/rules-repository'

export const rulesQueryKey = ['rules']

export function useRulesQuery() {
  return useQuery({
    queryKey: rulesQueryKey,
    queryFn: listRules,
  })
}

export function useCreateRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RuleInput) => createRule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rulesQueryKey })
      toast.success('Правило создано.')
    },
  })
}

export function useUpdateRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: RuleInput }) =>
      updateRule(ruleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rulesQueryKey })
      toast.success('Правило обновлено.')
    },
  })
}

export function useDeleteRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRule,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rulesQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['currencies'] }),
      ])
      toast.success('Правило удалено.')
    },
  })
}

export function useToggleRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleRuleStatus,
    onSuccess: async (rule) => {
      await queryClient.invalidateQueries({ queryKey: rulesQueryKey })
      toast.success(
        rule.status === 'active' ? 'Правило активировано.' : 'Правило деактивировано.',
      )
    },
  })
}
