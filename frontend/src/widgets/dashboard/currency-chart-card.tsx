import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MarketHistoryPoint } from '@/entities/currency/types'
import { formatRate } from '@/shared/lib/format'

export function CurrencyChartCard({
  pair,
  data,
  isLoading,
}: {
  pair: string
  data?: MarketHistoryPoint[]
  isLoading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="rounded-[2rem] border-white/10 bg-slate-950/75 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              История рынка
            </p>
            <CardTitle className="font-heading text-2xl text-white">
              Динамика {pair}
            </CardTitle>
            <p className="text-sm text-slate-400">
              График в trading-стиле с hover-значениями и чистой dark-подачей.
            </p>
          </div>
        </CardHeader>
        <CardContent className="h-[320px]">
          {isLoading ? (
            <div className="flex h-full flex-col justify-between gap-4">
              <Skeleton className="h-4 w-40 bg-white/8" />
              <Skeleton className="h-full rounded-[1.5rem] bg-white/6" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="pair-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Intl.DateTimeFormat('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(value))
                  }
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => formatRate(value)}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(2, 6, 23, 0.95)',
                    color: '#f8fafc',
                    backdropFilter: 'blur(18px)',
                  }}
                  labelFormatter={(value) =>
                    new Intl.DateTimeFormat('ru-RU', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(value))
                  }
                  formatter={(value) => [formatRate(Number(value ?? 0)), 'Курс']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fill="url(#pair-gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
