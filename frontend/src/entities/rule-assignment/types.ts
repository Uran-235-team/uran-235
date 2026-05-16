export type RuleAssignment = {
  id: number
  exchangeId: string | null
  currency: string | null
  ruleSetId: number
  validFrom: string
  validTo: string
}

export type RuleAssignmentInput = {
  exchangeId: string | null
  currency: string | null
  ruleSetId: number
  validFrom: string
  validTo: string
}

export type RuleAssignmentUpdate = {
  ruleSetId?: number
  validFrom?: string
  validTo?: string
}
