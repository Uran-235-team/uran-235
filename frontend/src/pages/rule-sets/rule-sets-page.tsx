import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ArrowRight, PencilLine, Plus, Trash2, Unlink } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { RuleSet } from '@/entities/rule-set/types'
import {
  useCreateRuleSetMutation,
  useDeleteRuleSetMutation,
  useLinkRuleMutation,
  useRuleSetRulesQuery,
  useRuleSetsQuery,
  useUnlinkRuleMutation,
  useUpdateRuleSetMutation,
} from '@/features/rule-sets/api/use-rule-sets'
import { AutoGenerateRulesButton } from '@/features/rule-sets/components/auto-generate-rules-button'
import { LinkRuleDialog } from '@/features/rule-sets/components/link-rule-dialog'
import { RuleSetFormDialog } from '@/features/rule-sets/components/rule-set-form-dialog'
import { useRulesQuery } from '@/features/rules/api/use-rules'
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
  const className = tone === 'trash' ? 'trash-button' : 'edit-button'

  return (
    <button className={`icon-button ${className}`} type="button" onClick={onClick} aria-label={label}>
      <span className="icon-art">{children}</span>
    </button>
  )
}

export function RuleSetsPage() {
  const ruleSetsQuery = useRuleSetsQuery()
  const rulesQuery = useRulesQuery()
  const createMutation = useCreateRuleSetMutation()
  const updateMutation = useUpdateRuleSetMutation()
  const deleteMutation = useDeleteRuleSetMutation()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RuleSet | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)

  const effectiveSelectedId =
    selectedId && ruleSetsQuery.data?.some((set) => set.id === selectedId)
      ? selectedId
      : ruleSetsQuery.data?.[0]?.id ?? null

  const selectedRuleSet =
    ruleSetsQuery.data?.find((set) => set.id === effectiveSelectedId) ?? null
  const setRulesQuery = useRuleSetRulesQuery(selectedRuleSet?.id ?? null)
  const linkMutation = useLinkRuleMutation(selectedRuleSet?.id ?? 0)
  const unlinkMutation = useUnlinkRuleMutation(selectedRuleSet?.id ?? 0)

  const linkedIds = useMemo(
    () => new Set((setRulesQuery.data ?? []).map((rule) => rule.id)),
    [setRulesQuery.data],
  )
  const candidates = useMemo(
    () => (rulesQuery.data ?? []).filter((rule) => !linkedIds.has(rule.id)),
    [rulesQuery.data, linkedIds],
  )

  return (
    <div className="page-wrap">
      <h1 className="page-title">Правила</h1>
      <p className="page-subtitle">
        Здесь условия объединяются в правила. Состав выбранного правила редактируется в нижней
        таблице, а назначение правил на биржи и валюты вынесено в отдельную страницу.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          className="formula-button magnetic"
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Создать правило
        </button>
        <Link className="formula-button magnetic" to="/rule-assignments">
          Управление правилами
          <ArrowRight className="size-4" />
        </Link>
        <AutoGenerateRulesButton onSuccess={() => setSelectedId(null)} />
      </div>

      <section className="formulas-table" aria-label="Список правил">
        <div
          className="formulas-head"
          style={{ gridTemplateColumns: '1fr 170px 190px' }}
        >
          <span>Название</span>
          <span className="formula-action">ID</span>
          <span className="formula-action">Действия</span>
        </div>
        <div className="formulas-body">
          {(ruleSetsQuery.data ?? []).length === 0 ? (
            <div
              className="formula-row"
              style={{ gridTemplateColumns: '1fr 170px 190px' }}
            >
              <span className="formula-name">Правил пока нет</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
            </div>
          ) : (
            (ruleSetsQuery.data ?? []).map((ruleSet) => (
              <div
                key={ruleSet.id}
                className="formula-row"
                style={{
                  gridTemplateColumns: '1fr 170px 190px',
                  background:
                    effectiveSelectedId === ruleSet.id
                      ? 'rgba(125, 242, 154, 0.09)'
                      : undefined,
                }}
              >
                <button
                  type="button"
                  className="formula-name cursor-pointer border-0 bg-transparent text-left"
                  onClick={() => setSelectedId(ruleSet.id)}
                >
                  {ruleSet.title}
                </button>
                <span className="formula-action">#{ruleSet.id}</span>
                <span className="formula-action gap-3">
                  <ActionIconButton
                    tone="edit"
                    label="Редактировать правило"
                    onClick={() => {
                      setEditing(ruleSet)
                      setFormOpen(true)
                    }}
                  >
                    <PencilLine className="size-5" />
                  </ActionIconButton>
                  <ActionIconButton
                    tone="trash"
                    label="Удалить правило"
                    onClick={() =>
                      deleteMutation.mutate(ruleSet.id, {
                        onSuccess: () => {
                          if (effectiveSelectedId === ruleSet.id) setSelectedId(null)
                        },
                      })
                    }
                  >
                    <Trash2 className="size-5" />
                  </ActionIconButton>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-10 mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="page-title mb-2 text-[28px]">
            {selectedRuleSet ? `Состав: ${selectedRuleSet.title}` : 'Состав правила'}
          </h2>
          <p className="page-subtitle mb-0">
            {selectedRuleSet
              ? 'Добавляйте и удаляйте условия внутри выбранного правила.'
              : 'Выберите правило в верхней таблице, чтобы увидеть его состав.'}
          </p>
        </div>
        <button
          className="formula-button magnetic"
          type="button"
          disabled={!selectedRuleSet}
          onClick={() => setLinkOpen(true)}
        >
          <Plus className="size-4" />
          Добавить условие
        </button>
      </div>

      <section className="formulas-table" aria-label="Состав правила">
        <div
          className="formulas-head"
          style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
        >
          <span>Условие</span>
          <span className="formula-action">Диапазон</span>
          <span className="formula-action">Наценка</span>
          <span className="formula-action">Действия</span>
        </div>
        <div className="formulas-body">
          {!selectedRuleSet ? (
            <div
              className="formula-row"
              style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
            >
              <span className="formula-name">Правило не выбрано</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
            </div>
          ) : (setRulesQuery.data ?? []).length === 0 ? (
            <div
              className="formula-row"
              style={{ gridTemplateColumns: '1fr 220px 150px 190px' }}
            >
              <span className="formula-name">Внутри правила пока нет условий</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
            </div>
          ) : (
            (setRulesQuery.data ?? []).map((rule) => (
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
                  <span className="text-sm text-[rgba(248,250,250,0.75)]">В составе</span>
                  <ActionIconButton
                    tone="trash"
                    label="Убрать условие из правила"
                    onClick={() => unlinkMutation.mutate(rule.id)}
                  >
                    <Unlink className="size-5" />
                  </ActionIconButton>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <RuleSetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          if (editing) {
            updateMutation.mutate(
              { ruleSetId: editing.id, payload: values },
              { onSuccess: () => setFormOpen(false) },
            )
            return
          }

          createMutation.mutate(values, {
            onSuccess: (created) => {
              setFormOpen(false)
              setSelectedId(created.id)
            },
          })
        }}
      />

      <LinkRuleDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        candidates={candidates}
        isPending={linkMutation.isPending}
        onConfirm={(ruleId) =>
          linkMutation.mutate(ruleId, {
            onSuccess: () => setLinkOpen(false),
          })
        }
      />
    </div>
  )
}
