import { useState } from 'react'
import type { ReactNode } from 'react'

import { PencilLine, Plus, Trash2 } from 'lucide-react'

import type { Rule } from '@/entities/rule/types'
import {
  useCreateRuleMutation,
  useDeleteRuleMutation,
  useRulesQuery,
  useUpdateRuleMutation,
} from '@/features/rules/api/use-rules'
import { RuleFormDialog } from '@/features/rules/components/rule-form-dialog'
import { formatDecimal } from '@/shared/lib/format'

function ActionIconButton({
  tone,
  onClick,
  children,
  label,
}: {
  tone: 'edit' | 'trash'
  onClick: () => void
  children: ReactNode
  label: string
}) {
  return (
    <button
      className={`icon-button ${tone === 'edit' ? 'edit-button' : 'trash-button'}`}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      <span className="icon-art">{children}</span>
    </button>
  )
}

export function RulesPage() {
  const rulesQuery = useRulesQuery()
  const createRuleMutation = useCreateRuleMutation()
  const updateRuleMutation = useUpdateRuleMutation()
  const deleteRuleMutation = useDeleteRuleMutation()
  const [open, setOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  return (
    <div className="page-wrap">
      <h1 className="page-title">Условия</h1>
      <p className="page-subtitle">
        Здесь задаются отдельные условия: диапазон цены и процент наценки. Позже эти условия
        собираются в правила на отдельной странице.
      </p>

      <div className="toolbar-row">
        <button
          className="formula-button magnetic"
          type="button"
          onClick={() => {
            setEditingRule(null)
            setOpen(true)
          }}
        >
          <Plus className="size-4" />
          Создать условие
        </button>
      </div>

      <section className="formulas-table" aria-label="Список условий">
        <div
          className="formulas-head"
          style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
        >
          <span>Название</span>
          <span className="formula-action">Диапазон</span>
          <span className="formula-action">Наценка</span>
          <span className="formula-action">Действия</span>
        </div>
        <div className="formulas-body">
          {(rulesQuery.data ?? []).length === 0 ? (
            <div
              className="formula-row"
              style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
            >
              <span className="formula-name">Условий пока нет</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
            </div>
          ) : (
            (rulesQuery.data ?? []).map((rule) => (
              <div
                key={rule.id}
                className="formula-row"
                style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
              >
                <span className="formula-name">{rule.title}</span>
                <span className="formula-action">
                  {formatDecimal(rule.low)} - {formatDecimal(rule.high)}
                </span>
                <span className="formula-action">{rule.extra}%</span>
                <span className="formula-action gap-3">
                  <ActionIconButton
                    tone="edit"
                    label="Редактировать условие"
                    onClick={() => {
                      setEditingRule(rule)
                      setOpen(true)
                    }}
                  >
                    <PencilLine className="size-5" />
                  </ActionIconButton>
                  <ActionIconButton
                    tone="trash"
                    label="Удалить условие"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="size-5" />
                  </ActionIconButton>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

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
