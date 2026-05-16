import type { Rule, RuleInput } from '@/entities/rule/types'
import { mockDelay } from '@/shared/lib/mock-delay'

import {
  rulesDb,
  unsetRuleFromCurrencies,
} from '@/services/repositories/stub-db'

export async function listRules() {
  await mockDelay()
  return [...rulesDb].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
}

export async function createRule(input: RuleInput) {
  await mockDelay(260)

  const rule: Rule = {
    id: `rule-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedPairs: [],
    ...input,
  }

  rulesDb.unshift(rule)
  return rule
}

export async function updateRule(ruleId: string, input: RuleInput) {
  await mockDelay(240)
  const index = rulesDb.findIndex((rule) => rule.id === ruleId)

  if (index === -1) {
    throw new Error('Rule not found.')
  }

  rulesDb[index] = {
    ...rulesDb[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }

  return rulesDb[index]
}

export async function deleteRule(ruleId: string) {
  await mockDelay(220)
  const index = rulesDb.findIndex((rule) => rule.id === ruleId)

  if (index === -1) {
    throw new Error('Rule not found.')
  }

  rulesDb.splice(index, 1)
  unsetRuleFromCurrencies(ruleId)
}

export async function toggleRuleStatus(ruleId: string) {
  await mockDelay(180)
  const rule = rulesDb.find((entry) => entry.id === ruleId)

  if (!rule) {
    throw new Error('Rule not found.')
  }

  rule.status = rule.status === 'active' ? 'disabled' : 'active'
  rule.updatedAt = new Date().toISOString()

  return rule
}
