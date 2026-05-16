import { apiClient } from '@/services/api/client'
import type { Rule } from '@/entities/rule/types'
import type { RuleSet, RuleSetInput } from '@/entities/rule-set/types'

type RuleDto = {
  id: number
  title: string
  extra: number
  low: string | number
  high: string | number
}

function mapRule(dto: RuleDto): Rule {
  return {
    id: dto.id,
    title: dto.title,
    extra: dto.extra,
    low: String(dto.low),
    high: String(dto.high),
  }
}

export async function listRuleSets() {
  const response = await apiClient.get<RuleSet[]>('/api/v1/rule-sets')
  return response.data
}

export async function createRuleSet(payload: RuleSetInput) {
  const response = await apiClient.post<RuleSet>('/api/v1/rule-sets', payload)
  return response.data
}

export async function updateRuleSet(ruleSetId: number, payload: RuleSetInput) {
  const response = await apiClient.patch<RuleSet>(`/api/v1/rule-sets/${ruleSetId}`, payload)
  return response.data
}

export async function deleteRuleSet(ruleSetId: number) {
  await apiClient.delete(`/api/v1/rule-sets/${ruleSetId}`)
}

export async function listRulesInRuleSet(ruleSetId: number) {
  const response = await apiClient.get<RuleDto[]>(`/api/v1/rule-sets/${ruleSetId}/rules`)
  return response.data.map(mapRule)
}

export async function linkRuleToRuleSet(ruleSetId: number, ruleId: number) {
  const response = await apiClient.post<RuleDto>(
    `/api/v1/rule-sets/${ruleSetId}/rules`,
    { rule_id: ruleId },
  )
  return mapRule(response.data)
}

export async function unlinkRuleFromRuleSet(ruleSetId: number, ruleId: number) {
  await apiClient.delete(`/api/v1/rule-sets/${ruleSetId}/rules/${ruleId}`)
}
