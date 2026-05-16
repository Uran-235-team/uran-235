import { apiClient } from '@/services/api/client'
import type { Rule, RuleInput, RuleUpdate } from '@/entities/rule/types'

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

export async function listRules() {
  const response = await apiClient.get<RuleDto[]>('/api/v1/rules')
  return response.data.map(mapRule)
}

export async function createRule(payload: RuleInput) {
  const response = await apiClient.post<RuleDto>('/api/v1/rules', payload)
  return mapRule(response.data)
}

export async function updateRule(ruleId: number, payload: RuleUpdate) {
  const response = await apiClient.patch<RuleDto>(`/api/v1/rules/${ruleId}`, payload)
  return mapRule(response.data)
}

export async function deleteRule(ruleId: number) {
  await apiClient.delete(`/api/v1/rules/${ruleId}`)
}
