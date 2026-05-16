import { apiClient } from '@/services/api/client'
import type { Exchange } from '@/entities/exchange/types'

export async function listExchanges() {
  const response = await apiClient.get<Exchange[]>('/api/v1/exchanges')
  return response.data
}
