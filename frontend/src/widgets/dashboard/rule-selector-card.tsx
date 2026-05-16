import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Rule } from '@/entities/rule/types'
import { StatusPill } from '@/shared/ui/status-pill'

export function RuleSelectorCard({
  rules,
  selectedRuleId,
  selectedPair,
  onRuleChange,
  onApply,
  isApplying,
}: {
  rules: Rule[]
  selectedRuleId: string
  selectedPair: string
  onRuleChange: (value: string) => void
  onApply: () => void
  isApplying: boolean
}) {
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
    >
      <Card className="h-full rounded-[2rem] border-white/10 bg-white/6 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Выбор правила
              </p>
              <CardTitle className="font-heading text-2xl text-white">
                Применение логики
              </CardTitle>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
              <Sparkles className="size-5 text-cyan-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Целевая пара</p>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
              {selectedPair}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Выберите правило</p>
            <Select value={selectedRuleId} onValueChange={onRuleChange}>
              <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-slate-950/70">
                <SelectValue placeholder="Выберите правило" />
              </SelectTrigger>
              <SelectContent>
                {rules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRule ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/75 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white">
                    {selectedRule.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedRule.parametersSummary}
                  </p>
                </div>
                <StatusPill tone={selectedRule.status}>
                  {selectedRule.status === 'active'
                    ? 'Активно'
                    : selectedRule.status === 'draft'
                      ? 'Черновик'
                      : 'Отключено'}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {selectedRule.description}
              </p>
            </div>
          ) : null}
          <Button
            size="lg"
            className="h-12 w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            onClick={onApply}
            disabled={!selectedRuleId || isApplying}
          >
            {isApplying ? 'Применяем правило...' : 'Применить правило к выбранной паре'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
