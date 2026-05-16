import { useQuery } from '@tanstack/react-query'

import { listExchanges } from '@/services/api/exchanges-api'

export const exchangesQueryKey = ['exchanges']

export function useExchangesQuery() {
  return useQuery({
    queryKey: exchangesQueryKey,
    queryFn: listExchanges,
    refetchInterval: 30_000,
  })
}
