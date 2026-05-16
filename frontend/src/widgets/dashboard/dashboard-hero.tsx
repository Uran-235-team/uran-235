import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ShieldCheck, WalletCards } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatCompactNumber } from '@/shared/lib/format'

const cardAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function DashboardHero({
  totalPairs,
  activeRules,
  alertCount,
  totalVolume,
}: {
  totalPairs: number
  activeRules: number
  alertCount: number
  totalVolume: number
}) {
  const metrics = [
    {
      label: 'Отслеживаемые пары',
      value: totalPairs.toString(),
      icon: WalletCards,
      tone: 'from-cyan-400/20 to-cyan-400/0',
    },
    {
      label: 'Активные правила',
      value: activeRules.toString(),
      icon: ShieldCheck,
      tone: 'from-blue-400/20 to-blue-400/0',
    },
    {
      label: 'Алерты наблюдения',
      value: alertCount.toString(),
      icon: AlertTriangle,
      tone: 'from-rose-400/20 to-rose-400/0',
    },
    {
      label: 'Объем за 24ч',
      value: formatCompactNumber(totalVolume),
      icon: Activity,
      tone: 'from-emerald-400/20 to-emerald-400/0',
    },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardAnimation}
        className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_30px_100px_rgba(2,6,23,0.65)] backdrop-blur-2xl"
      >
        <div className="space-y-5">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
            Dashboard валютных правил
          </div>
          <div className="space-y-3">
            <h1 className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Темный премиальный центр управления для мониторинга валют и применения правил.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Backend сейчас реально отдает авторизацию, а торговые правила и рыночные сценарии уже разложены как production-ready frontend-модули с типизированными заглушками под следующую API-итерацию.
            </p>
          </div>
        </div>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * (index + 1) }}
          >
            <Card className="h-full rounded-[1.75rem] border-white/10 bg-slate-950/75 backdrop-blur-2xl">
              <CardContent className="flex h-full flex-col justify-between gap-8 p-5">
                <div className={`w-fit rounded-2xl bg-gradient-to-br ${metric.tone} p-3`}>
                  <metric.icon className="size-5 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="font-heading text-3xl font-semibold text-white">
                    {metric.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
