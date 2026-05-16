import { apiClient } from '@/services/api/client'
import type { Exchange, PricedRate, PricedRatesResponse } from '@/entities/exchange/types'

type PricedRateDto = {
  raw: string | number
  final: string | number
  markup: string | number
  matched: boolean
  rule_set_id: number | null
  rule_id: number | null
  extra_pct: number | null
}

type PricedRatesResponseDto = {
  exchange_id: string
  rates: Record<string, PricedRateDto>
}

function mapPricedRate(dto: PricedRateDto): PricedRate {
  return {
    raw: String(dto.raw),
    final: String(dto.final),
    markup: String(dto.markup),
    matched: dto.matched,
    ruleSetId: dto.rule_set_id,
    ruleId: dto.rule_id,
    extraPct: dto.extra_pct,
  }
}

export async function listExchanges() {
  const response = await apiClient.get<Exchange[]>('/api/v1/exchanges')
  return response.data
}

export async function getPricedRates(exchangeId: string): Promise<PricedRatesResponse> {
  const response = await apiClient.get<PricedRatesResponseDto>(`/api/v1/exchanges/${exchangeId}/rates`)

  return {
    exchangeId: response.data.exchange_id,
    rates: Object.fromEntries(
      Object.entries(response.data.rates).map(([currency, rate]) => [currency, mapPricedRate(rate)]),
    ),
  }
}
