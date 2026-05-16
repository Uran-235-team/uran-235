export type Rule = {
  id: number
  title: string
  extra: number
  low: string
  high: string
}

export type RuleInput = {
  title: string
  extra: number
  low: string
  high: string
}

export type RuleUpdate = Partial<RuleInput>
