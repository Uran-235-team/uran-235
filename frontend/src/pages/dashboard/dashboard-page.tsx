import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'

import { useCurrenciesQuery, useCurrencyHistoryQuery } from '@/features/currencies/api/use-currencies'
import { useRulesQuery } from '@/features/rules/api/use-rules'
import { DashboardHero } from '@/widgets/dashboard/dashboard-hero'
import { CurrencyChartCard } from '@/widgets/dashboard/currency-chart-card'
import { CurrencyTableCard } from '@/widgets/dashboard/currency-table-card'
import { RuleSelectorCard } from '@/widgets/dashboard/rule-selector-card'
import { useApplyRuleMutation } from '@/features/currencies/api/use-currencies'

export function DashboardPage() {
  const queryClient = useQueryClient()
  const currenciesQuery = useCurrenciesQuery()
  const rulesQuery = useRulesQuery()
  const applyRuleMutation = useApplyRuleMutation()
  const [selectedPair, setSelectedPair] = useState('')
  const [selectedRuleId, setSelectedRuleId] = useState('')

  useEffect(() => {
    if (!selectedPair && currenciesQuery.data?.length) {
      setSelectedPair(currenciesQuery.data[0].pair)
    }
  }, [currenciesQuery.data, selectedPair])

  useEffect(() => {
    if (!selectedRuleId && rulesQuery.data?.length) {
      const firstActiveRule = rulesQuery.data.find((rule) => rule.status === 'active')
      setSelectedRuleId(firstActiveRule?.id ?? rulesQuery.data[0].id)
    }
  }, [rulesQuery.data, selectedRuleId])

  const historyQuery = useCurrencyHistoryQuery(selectedPair)

  const totalPairs = currenciesQuery.data?.length ?? 0
  const activeRules =
    rulesQuery.data?.filter((rule) => rule.status === 'active').length ?? 0
  const alertCount =
    currenciesQuery.data?.filter((currency) => currency.status === 'alert').length ?? 0
  const totalVolume =
    currenciesQuery.data?.reduce((sum, currency) => sum + currency.volume24h, 0) ?? 0

  return (
    <div className="space-y-8">
      <DashboardHero
        totalPairs={totalPairs}
        activeRules={activeRules}
        alertCount={alertCount}
        totalVolume={totalVolume}
      />
      <section className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <CurrencyChartCard
          pair={selectedPair}
          data={historyQuery.data}
          isLoading={historyQuery.isLoading}
        />
        <RuleSelectorCard
          rules={rulesQuery.data ?? []}
          selectedRuleId={selectedRuleId}
          selectedPair={selectedPair}
          onRuleChange={setSelectedRuleId}
          onApply={() =>
            applyRuleMutation.mutate({ pair: selectedPair, ruleId: selectedRuleId })
          }
          isApplying={applyRuleMutation.isPending}
        />
      </section>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CurrencyTableCard
          data={currenciesQuery.data}
          rules={rulesQuery.data ?? []}
          isLoading={currenciesQuery.isLoading}
          selectedPair={selectedPair}
          onSelectPair={(pair) => {
            setSelectedPair(pair)
            void queryClient.invalidateQueries({ queryKey: ['currency-history', pair] })
          }}
        />
      </motion.section>
    </div>
  )
}
