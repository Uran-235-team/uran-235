export type RuleType = 'threshold' | 'volatility' | 'spread' | 'schedule'

export type RuleStatus = 'active' | 'draft' | 'disabled'

export type Rule = {
  id: string
  name: string
  type: RuleType
  parametersSummary: string
  description: string
  status: RuleStatus
  createdAt: string
  updatedAt: string
  assignedPairs: string[]
}

export type RuleInput = Pick<
  Rule,
  'name' | 'type' | 'parametersSummary' | 'description' | 'status'
>
