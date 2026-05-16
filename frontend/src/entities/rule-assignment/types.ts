export type RuleAssignment = {
  id: number
  exchangeId: string | null
  currency: string | null
  ruleSetId: number
}

export type RuleAssignmentInput = {
  exchangeId: string | null
  currency: string | null
  ruleSetId: number
}

export type RuleAssignmentUpdate = {
  ruleSetId: number
}
