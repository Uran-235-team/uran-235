import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RuleInput, RuleUpdate } from '@/entities/rule/types'
import {
  createRule,
  deleteRule,
  listRules,
  updateRule,
} from '@/services/api/rules-api'

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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать правило.')
    },
  })
}

export function useUpdateRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: RuleUpdate }) =>
      updateRule(ruleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rulesQueryKey })
      toast.success('Правило обновлено.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить правило.')
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
        queryClient.invalidateQueries({ queryKey: ['rule-sets'] }),
      ])
      toast.success('Правило удалено.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить правило.')
    },
  })
}
