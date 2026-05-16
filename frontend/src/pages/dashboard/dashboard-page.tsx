import { useState } from 'react'

import { useExchangesQuery } from '@/features/exchanges/api/use-exchanges'
import { useLiveRates } from '@/features/exchanges/api/use-live-rates'
import { usePricedRateCharts } from '@/features/exchanges/api/use-priced-rate-charts'
import { useRulesQuery } from '@/features/rules/api/use-rules'
import { useRuleSetsQuery } from '@/features/rule-sets/api/use-rule-sets'
import { RatesCard } from '@/widgets/dashboard/rates-card'

export function DashboardPage() {
  const exchangesQuery = useExchangesQuery()
  const rulesQuery = useRulesQuery()
  const ruleSetsQuery = useRuleSetsQuery()
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null)
  const [visibleChartCodes, setVisibleChartCodes] = useState<string[]>([])

  const effectiveSelectedExchangeId =
    selectedExchangeId && exchangesQuery.data?.some((exchange) => exchange.id === selectedExchangeId)
      ? selectedExchangeId
      : exchangesQuery.data?.[0]?.id ?? null

  const selectedExchange =
    exchangesQuery.data?.find((exchange) => exchange.id === effectiveSelectedExchangeId) ?? null

  const { rates, status, messageCount } = useLiveRates(effectiveSelectedExchangeId)
  const { series, pricedRates } = usePricedRateCharts(
    effectiveSelectedExchangeId,
    rates,
    messageCount,
    visibleChartCodes,
  )

  return (
    <div className="dashboard-canvas">
      <RatesCard
        exchanges={exchangesQuery.data ?? []}
        exchangesLoading={exchangesQuery.isLoading}
        onOpenExchangeMenu={() => {
          void exchangesQuery.refetch()
        }}
        selectedExchangeId={effectiveSelectedExchangeId}
        onSelectExchange={setSelectedExchangeId}
        exchangeTitle={selectedExchange?.title ?? null}
        rates={rates}
        status={status}
        series={series}
        pricedRates={pricedRates}
        rules={rulesQuery.data ?? []}
        ruleSets={ruleSetsQuery.data ?? []}
        onVisibleChartCodesChange={setVisibleChartCodes}
      />
    </div>
  )
}
