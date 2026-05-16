import { motion } from 'framer-motion'
import { Activity, ShieldCheck, WalletCards } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

const cardAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function DashboardHero({
  exchangesCount,
  rulesCount,
  ruleSetsCount,
}: {
  exchangesCount: number
  rulesCount: number
  ruleSetsCount: number
}) {
  const metrics = [
    {
      label: 'Подключённые биржи',
      value: exchangesCount.toString(),
      icon: WalletCards,
      tone: 'from-cyan-400/20 to-cyan-400/0',
    },
    {
      label: 'Условия',
      value: rulesCount.toString(),
      icon: ShieldCheck,
      tone: 'from-blue-400/20 to-blue-400/0',
    },
    {
      label: 'Правила',
      value: ruleSetsCount.toString(),
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
            Главный экран
          </div>
          <div className="space-y-3">
            <h1 className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Live-курсы и правила торговли в одной операторской панели.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Биржи подключаются через emulator по WebSocket. Здесь можно выбрать нужную биржу,
              увидеть входящие валюты и сверить, как к ним применяется правило.
            </p>
          </div>
        </div>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * (index + 1) }}
          >
            <Card className="h-full rounded-[1.75rem] border-white/10 bg-slate-950/75 backdrop-blur-2xl">
              <CardContent className="flex h-full items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="font-heading text-3xl font-semibold text-white">
                    {metric.value}
                  </p>
                </div>
                <div className={`rounded-2xl bg-gradient-to-br ${metric.tone} p-3`}>
                  <metric.icon className="size-5 text-white" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
