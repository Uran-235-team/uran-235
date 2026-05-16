import { create } from 'zustand'

import type { LiveRates } from '@/entities/exchange/types'

type CurrencySuggestionsState = {
  seenCurrencies: string[]
  rememberFromRates: (rates: LiveRates) => void
}

export const useCurrencySuggestionsStore = create<CurrencySuggestionsState>((set) => ({
  seenCurrencies: [],
  rememberFromRates: (rates) =>
    set((state) => {
      const next = new Set(state.seenCurrencies)

      for (const code of Object.keys(rates)) {
        if (code.trim()) next.add(code.trim().toUpperCase())
      }

      return {
        seenCurrencies: [...next].sort((a, b) => a.localeCompare(b)),
      }
    }),
}))
