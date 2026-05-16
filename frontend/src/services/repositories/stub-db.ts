import type { CurrencyPair, MarketHistoryPoint } from '@/entities/currency/types'
import type { Rule } from '@/entities/rule/types'

const now = Date.now()

export let rulesDb: Rule[] = [
  {
    id: 'rule-breakout',
    name: 'Breakout Pulse',
    type: 'threshold',
    parametersSummary: 'Buy above 1.0830, alert below 1.0760',
    description: 'Momentum threshold rule focused on upside breakout continuation.',
    status: 'active',
    createdAt: new Date(now - 8 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 3_600_000).toISOString(),
    assignedPairs: ['EUR/USD', 'BTC/USD'],
  },
  {
    id: 'rule-volatility',
    name: 'Volatility Guard',
    type: 'volatility',
    parametersSummary: 'Alert when 1h swing exceeds 1.8%',
    description: 'Flags pairs that break expected intraday movement bands.',
    status: 'active',
    createdAt: new Date(now - 6 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 2 * 3_600_000).toISOString(),
    assignedPairs: ['GBP/USD', 'ETH/USD'],
  },
  {
    id: 'rule-spread',
    name: 'Spread Compression',
    type: 'spread',
    parametersSummary: 'Watch when spread drops below 0.12%',
    description: 'Looks for clean entries on compressed spreads.',
    status: 'draft',
    createdAt: new Date(now - 4 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 5 * 3_600_000).toISOString(),
    assignedPairs: ['USD/JPY'],
  },
  {
    id: 'rule-session',
    name: 'Session Rotation',
    type: 'schedule',
    parametersSummary: 'Enable during London + NY overlap',
    description: 'Activates only during overlapping high-liquidity sessions.',
    status: 'disabled',
    createdAt: new Date(now - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(now - 7 * 3_600_000).toISOString(),
    assignedPairs: [],
  },
]

export let currenciesDb: CurrencyPair[] = [
  {
    id: 'eurusd',
    pair: 'EUR/USD',
    rate: 1.0812,
    changePercent: 0.84,
    status: 'stable',
    activeRuleId: 'rule-breakout',
    lastUpdated: new Date(now - 3 * 60_000).toISOString(),
    volume24h: 9200000,
    spread: 0.08,
  },
  {
    id: 'gbpusd',
    pair: 'GBP/USD',
    rate: 1.2743,
    changePercent: -0.42,
    status: 'watch',
    activeRuleId: 'rule-volatility',
    lastUpdated: new Date(now - 5 * 60_000).toISOString(),
    volume24h: 6100000,
    spread: 0.11,
  },
  {
    id: 'usdjpy',
    pair: 'USD/JPY',
    rate: 155.24,
    changePercent: 1.31,
    status: 'alert',
    activeRuleId: 'rule-spread',
    lastUpdated: new Date(now - 2 * 60_000).toISOString(),
    volume24h: 8300000,
    spread: 0.09,
  },
  {
    id: 'audusd',
    pair: 'AUD/USD',
    rate: 0.6624,
    changePercent: 0.28,
    status: 'stable',
    activeRuleId: null,
    lastUpdated: new Date(now - 8 * 60_000).toISOString(),
    volume24h: 3700000,
    spread: 0.14,
  },
  {
    id: 'btcusd',
    pair: 'BTC/USD',
    rate: 67854.42,
    changePercent: 2.74,
    status: 'alert',
    activeRuleId: 'rule-breakout',
    lastUpdated: new Date(now - 1 * 60_000).toISOString(),
    volume24h: 18400000,
    spread: 0.16,
  },
  {
    id: 'ethusd',
    pair: 'ETH/USD',
    rate: 3122.8,
    changePercent: -1.12,
    status: 'watch',
    activeRuleId: 'rule-volatility',
    lastUpdated: new Date(now - 4 * 60_000).toISOString(),
    volume24h: 12100000,
    spread: 0.18,
  },
  {
    id: 'usdcad',
    pair: 'USD/CAD',
    rate: 1.3663,
    changePercent: 0.19,
    status: 'inactive',
    activeRuleId: null,
    lastUpdated: new Date(now - 15 * 60_000).toISOString(),
    volume24h: 2800000,
    spread: 0.22,
  },
  {
    id: 'solusd',
    pair: 'SOL/USD',
    rate: 174.3,
    changePercent: 4.31,
    status: 'alert',
    activeRuleId: null,
    lastUpdated: new Date(now - 6 * 60_000).toISOString(),
    volume24h: 7300000,
    spread: 0.21,
  },
]

const historyCache = new Map<string, MarketHistoryPoint[]>()

export function getRuleById(ruleId: string | null) {
  return rulesDb.find((rule) => rule.id === ruleId) ?? null
}

export function unsetRuleFromCurrencies(ruleId: string) {
  currenciesDb = currenciesDb.map((currency) =>
    currency.activeRuleId === ruleId
      ? { ...currency, activeRuleId: null }
      : currency,
  )
}

export function assignRuleToCurrency(ruleId: string, pair: string) {
  const rule = getRuleById(ruleId)
  if (!rule) {
    return
  }

  currenciesDb = currenciesDb.map((currency) =>
    currency.pair === pair
      ? {
          ...currency,
          activeRuleId: ruleId,
          lastUpdated: new Date().toISOString(),
        }
      : currency,
  )

  rulesDb = rulesDb.map((entry) =>
    entry.id === ruleId
      ? {
          ...entry,
          assignedPairs: Array.from(new Set([...entry.assignedPairs, pair])),
          updatedAt: new Date().toISOString(),
        }
      : entry,
  )
}

export function generateHistory(pair: string) {
  const cached = historyCache.get(pair)

  if (cached) {
    return cached
  }

  const currency = currenciesDb.find((entry) => entry.pair === pair)
  const baseRate = currency?.rate ?? 1
  const created = Array.from({ length: 24 }, (_, index) => {
    const progress = index / 23
    const variance = Math.sin(progress * Math.PI * 2.5) * baseRate * 0.015
    const drift = (progress - 0.5) * baseRate * 0.01

    return {
      timestamp: new Date(now - (23 - index) * 3_600_000).toISOString(),
      rate: Number((baseRate + variance + drift).toFixed(4)),
    }
  })

  historyCache.set(pair, created)
  return created
}
