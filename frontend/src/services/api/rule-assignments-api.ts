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
  valid_from: string
  valid_to: string
}

function mapAssignment(dto: RuleAssignmentDto): RuleAssignment {
  return {
    id: dto.id,
    exchangeId: dto.exchange_id,
    currency: dto.currency,
    ruleSetId: dto.rule_set_id,
    validFrom: dto.valid_from,
    validTo: dto.valid_to,
  }
}

function toDto(payload: RuleAssignmentInput | RuleAssignmentUpdate) {
  if ('exchangeId' in payload) {
    return {
      exchange_id: payload.exchangeId,
      currency: payload.currency,
      rule_set_id: payload.ruleSetId,
      valid_from: payload.validFrom,
      valid_to: payload.validTo,
    }
  }

  return {
    ...(payload.ruleSetId != null ? { rule_set_id: payload.ruleSetId } : {}),
    ...(payload.validFrom != null ? { valid_from: payload.validFrom } : {}),
    ...(payload.validTo != null ? { valid_to: payload.validTo } : {}),
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
