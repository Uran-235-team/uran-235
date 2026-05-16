import { useState } from 'react'

import { motion } from 'framer-motion'

import type { Rule } from '@/entities/rule/types'
import {
  useCreateRuleMutation,
  useDeleteRuleMutation,
  useRulesQuery,
  useUpdateRuleMutation,
} from '@/features/rules/api/use-rules'
import { RuleFormDialog } from '@/features/rules/components/rule-form-dialog'
import { RulesTable } from '@/widgets/rules/rules-table'

export function RulesPage() {
  const rulesQuery = useRulesQuery()
  const createRuleMutation = useCreateRuleMutation()
  const updateRuleMutation = useUpdateRuleMutation()
  const deleteRuleMutation = useDeleteRuleMutation()
  const [open, setOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Управление правилами</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-white">
          Правила торговли
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
          Каждое правило — интервал цены [low, high] с дополнительным параметром extra. Привязка к наборам правил — на отдельной странице.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RulesTable
          rules={rulesQuery.data ?? []}
          onCreate={() => {
            setEditingRule(null)
            setOpen(true)
          }}
          onEdit={(rule) => {
            setEditingRule(rule)
            setOpen(true)
          }}
          onDelete={(ruleId) => deleteRuleMutation.mutate(ruleId)}
        />
      </motion.div>
      <RuleFormDialog
        open={open}
        onOpenChange={setOpen}
        initialRule={editingRule}
        isPending={createRuleMutation.isPending || updateRuleMutation.isPending}
        onSubmit={(values) => {
          if (editingRule) {
            updateRuleMutation.mutate(
              { ruleId: editingRule.id, payload: values },
              {
                onSuccess: () => {
                  setOpen(false)
                  setEditingRule(null)
                },
              },
            )
            return
          }

          createRuleMutation.mutate(values, {
            onSuccess: () => setOpen(false),
          })
        }}
      />
    </div>
  )
}
