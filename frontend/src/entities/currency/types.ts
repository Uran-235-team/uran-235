export type CurrencyStatus = 'stable' | 'watch' | 'alert' | 'inactive'

export type CurrencyPair = {
  id: string
  pair: string
  rate: number
  changePercent: number
  status: CurrencyStatus
  activeRuleId: string | null
  lastUpdated: string
  volume24h: number
  spread: number
}

export type MarketHistoryPoint = {
  timestamp: string
  rate: number
}
