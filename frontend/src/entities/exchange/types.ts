export type Exchange = {
  id: string
  title: string
}

export type LiveRates = Record<string, number>

export type LiveRatesMessage = {
  rates: LiveRates
  observedAt: string | null
}

export type PricedRate = {
  raw: string
  final: string
  markup: string
  matched: boolean
  ruleSetId: number | null
  ruleId: number | null
  extraPct: number | null
}

export type PricedRates = Record<string, PricedRate>

export type PricedRatesResponse = {
  exchangeId: string
  rates: PricedRates
}

export type CurrencyChartPoint = {
  id: string
  at: number
  raw: number
  final: number | null
}

export type CurrencyChartSeries = Record<string, CurrencyChartPoint[]>
