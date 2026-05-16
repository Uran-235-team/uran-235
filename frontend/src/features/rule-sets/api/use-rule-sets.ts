import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RuleSetInput } from '@/entities/rule-set/types'
import {
  createRuleSet,
  deleteRuleSet,
  linkRuleToRuleSet,
  listRuleSets,
  listRulesInRuleSet,
  unlinkRuleFromRuleSet,
  updateRuleSet,
} from '@/services/api/rule-sets-api'

export const ruleSetsQueryKey = ['rule-sets']

export function ruleSetRulesQueryKey(ruleSetId: number | null | undefined) {
  return ['rule-sets', ruleSetId, 'rules'] as const
}

export function useRuleSetsQuery() {
  return useQuery({
    queryKey: ruleSetsQueryKey,
    queryFn: listRuleSets,
  })
}

export function useRuleSetRulesQuery(ruleSetId: number | null) {
  return useQuery({
    queryKey: ruleSetRulesQueryKey(ruleSetId),
    queryFn: () => listRulesInRuleSet(ruleSetId as number),
    enabled: ruleSetId != null,
  })
}

export function useCreateRuleSetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RuleSetInput) => createRuleSet(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleSetsQueryKey })
      toast.success('Набор создан.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать набор.')
    },
  })
}

export function useUpdateRuleSetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleSetId, payload }: { ruleSetId: number; payload: RuleSetInput }) =>
      updateRuleSet(ruleSetId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleSetsQueryKey })
      toast.success('Набор обновлён.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить набор.')
    },
  })
}

export function useDeleteRuleSetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRuleSet,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleSetsQueryKey })
      toast.success('Набор удалён.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить набор.')
    },
  })
}

export function useLinkRuleMutation(ruleSetId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: number) => linkRuleToRuleSet(ruleSetId, ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleSetRulesQueryKey(ruleSetId) })
      toast.success('Правило привязано.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось привязать правило.')
    },
  })
}

export function useUnlinkRuleMutation(ruleSetId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: number) => unlinkRuleFromRuleSet(ruleSetId, ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleSetRulesQueryKey(ruleSetId) })
      toast.success('Правило отвязано.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось отвязать правило.')
    },
  })
}
