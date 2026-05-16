import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'

import { useExchangesQuery } from '@/features/exchanges/api/use-exchanges'
import { useLiveRates } from '@/features/exchanges/api/use-live-rates'
import { useRuleSetsQuery } from '@/features/rule-sets/api/use-rule-sets'
import { useRulesQuery } from '@/features/rules/api/use-rules'
import { DashboardHero } from '@/widgets/dashboard/dashboard-hero'
import { ExchangesCard } from '@/widgets/dashboard/exchanges-card'
import { RatesCard } from '@/widgets/dashboard/rates-card'

export function DashboardPage() {
  const exchangesQuery = useExchangesQuery()
  const rulesQuery = useRulesQuery()
  const ruleSetsQuery = useRuleSetsQuery()
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedExchangeId && exchangesQuery.data?.length) {
      setSelectedExchangeId(exchangesQuery.data[0].id)
    }
  }, [exchangesQuery.data, selectedExchangeId])

  const selectedExchange =
    exchangesQuery.data?.find((exchange) => exchange.id === selectedExchangeId) ?? null

  const { rates, status } = useLiveRates(selectedExchangeId)

  return (
    <div className="space-y-8">
      <DashboardHero
        exchangesCount={exchangesQuery.data?.length ?? 0}
        rulesCount={rulesQuery.data?.length ?? 0}
        ruleSetsCount={ruleSetsQuery.data?.length ?? 0}
      />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 xl:grid-cols-[0.9fr_1.7fr]"
      >
        <ExchangesCard
          exchanges={exchangesQuery.data}
          isLoading={exchangesQuery.isLoading}
          selectedExchangeId={selectedExchangeId}
          onSelect={setSelectedExchangeId}
        />
        <RatesCard
          exchangeTitle={selectedExchange?.title ?? null}
          rates={rates}
          status={status}
        />
      </motion.section>
    </div>
  )
}
