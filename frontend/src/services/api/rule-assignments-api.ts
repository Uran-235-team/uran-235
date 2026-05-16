import type {
  RuleAssignment,
  RuleAssignmentInput,
  RuleAssignmentUpdate,
} from '@/entities/rule-assignment/types'
import { apiClient } from '@/services/api/client'

type RuleAssignmentDto = {
  id: number
  exchange_id: string | null
  currency: string | null
  rule_set_id: number
}

function mapAssignment(dto: RuleAssignmentDto): RuleAssignment {
  return {
    id: dto.id,
    exchangeId: dto.exchange_id,
    currency: dto.currency,
    ruleSetId: dto.rule_set_id,
  }
}

function toDto(payload: RuleAssignmentInput | RuleAssignmentUpdate) {
  if ('exchangeId' in payload) {
    return {
      exchange_id: payload.exchangeId,
      currency: payload.currency,
      rule_set_id: payload.ruleSetId,
    }
  }

  return {
    rule_set_id: payload.ruleSetId,
  }
}

export async function listRuleAssignments() {
  const response = await apiClient.get<RuleAssignmentDto[]>('/api/v1/rule-assignments')
  return response.data.map(mapAssignment)
}

export async function createRuleAssignment(payload: RuleAssignmentInput) {
  const response = await apiClient.post<RuleAssignmentDto>('/api/v1/rule-assignments', toDto(payload))
  return mapAssignment(response.data)
}

export async function updateRuleAssignment(
  assignmentId: number,
  payload: RuleAssignmentUpdate,
) {
  const response = await apiClient.patch<RuleAssignmentDto>(
    `/api/v1/rule-assignments/${assignmentId}`,
    toDto(payload),
  )
  return mapAssignment(response.data)
}

export async function deleteRuleAssignment(assignmentId: number) {
  await apiClient.delete(`/api/v1/rule-assignments/${assignmentId}`)
}
