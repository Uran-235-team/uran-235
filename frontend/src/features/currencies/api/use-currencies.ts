import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  applyRuleToCurrency,
  getCurrencyHistory,
  listCurrencies,
} from '@/services/repositories/market-repository'

export const currenciesQueryKey = ['currencies']

export function useCurrenciesQuery() {
  return useQuery({
    queryKey: currenciesQueryKey,
    queryFn: listCurrencies,
    refetchInterval: 30_000,
  })
}

export function useCurrencyHistoryQuery(pair: string) {
  return useQuery({
    queryKey: ['currency-history', pair],
    queryFn: () => getCurrencyHistory(pair),
    enabled: Boolean(pair),
  })
}

export function useApplyRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ruleId, pair }: { ruleId: string; pair: string }) =>
      applyRuleToCurrency(ruleId, pair),
    onSuccess: async (_currency, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: currenciesQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['rules'] }),
      ])
      toast.success(`Правило применено к ${variables.pair}.`)
    },
  })
}
