import { apiClient } from '@/services/api/client'

export type AutoGenerateResult = {
  deleted_rules: number
  deleted_rule_sets: number
  deleted_assignments: number
  created_rules: number
  skipped_currencies: number
  exchanges: number
}

export async function autoGenerateRules() {
  const response = await apiClient.post<AutoGenerateResult>('/api/v1/auto-rules/generate')
  return response.data
}

