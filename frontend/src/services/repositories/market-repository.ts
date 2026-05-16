import type { CurrencyPair } from '@/entities/currency/types'
import { mockDelay } from '@/shared/lib/mock-delay'

import {
  assignRuleToCurrency,
  currenciesDb,
  generateHistory,
} from '@/services/repositories/stub-db'

export async function listCurrencies() {
  await mockDelay()
  return [...currenciesDb]
}

export async function getCurrencyHistory(pair: string) {
  await mockDelay(180)
  return generateHistory(pair)
}

export async function applyRuleToCurrency(ruleId: string, pair: string) {
  await mockDelay(180)

  const currency = currenciesDb.find((entry) => entry.pair === pair)

  if (!currency) {
    throw new Error('Currency pair not found.')
  }

  assignRuleToCurrency(ruleId, pair)

  return currency as CurrencyPair
}
