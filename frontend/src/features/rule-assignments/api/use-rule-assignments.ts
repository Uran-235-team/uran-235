import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type {
  RuleAssignmentInput,
  RuleAssignmentUpdate,
} from '@/entities/rule-assignment/types'
import {
  createRuleAssignment,
  deleteRuleAssignment,
  listRuleAssignments,
  updateRuleAssignment,
} from '@/services/api/rule-assignments-api'

export const ruleAssignmentsQueryKey = ['rule-assignments']

export function useRuleAssignmentsQuery() {
  return useQuery({
    queryKey: ruleAssignmentsQueryKey,
    queryFn: listRuleAssignments,
  })
}

export function useCreateRuleAssignmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RuleAssignmentInput) => createRuleAssignment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleAssignmentsQueryKey })
      toast.success('Назначение создано.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать назначение.')
    },
  })
}

export function useUpdateRuleAssignmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      payload,
    }: {
      assignmentId: number
      payload: RuleAssignmentUpdate
    }) => updateRuleAssignment(assignmentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleAssignmentsQueryKey })
      toast.success('Назначение обновлено.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить назначение.')
    },
  })
}

export function useDeleteRuleAssignmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRuleAssignment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ruleAssignmentsQueryKey })
      toast.success('Назначение удалено.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить назначение.')
    },
  })
}
