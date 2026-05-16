import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { PencilLine, Plus, Trash2 } from 'lucide-react'

import type { RuleAssignment } from '@/entities/rule-assignment/types'
import { useExchangesQuery } from '@/features/exchanges/api/use-exchanges'
import {
  useCreateRuleAssignmentMutation,
  useDeleteRuleAssignmentMutation,
  useRuleAssignmentsQuery,
  useUpdateRuleAssignmentMutation,
} from '@/features/rule-assignments/api/use-rule-assignments'
import { RuleAssignmentDialog } from '@/features/rule-assignments/components/rule-assignment-dialog'
import { useRuleSetsQuery } from '@/features/rule-sets/api/use-rule-sets'

function describeAssignmentScope(assignment: RuleAssignment) {
  const exchange = assignment.exchangeId ?? 'Любая биржа'
  const currency = assignment.currency ?? 'Любая валюта'
  return `${exchange} / ${currency}`
}

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

export function RuleAssignmentsPage() {
  const ruleSetsQuery = useRuleSetsQuery()
  const exchangesQuery = useExchangesQuery()
  const assignmentsQuery = useRuleAssignmentsQuery()

  const createAssignmentMutation = useCreateRuleAssignmentMutation()
  const updateAssignmentMutation = useUpdateRuleAssignmentMutation()
  const deleteAssignmentMutation = useDeleteRuleAssignmentMutation()

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<RuleAssignment | null>(null)

  const ruleSetTitles = useMemo(
    () =>
      new Map((ruleSetsQuery.data ?? []).map((ruleSet) => [ruleSet.id, ruleSet.title] as const)),
    [ruleSetsQuery.data],
  )

  const assignments = useMemo(
    () =>
      [...(assignmentsQuery.data ?? [])].sort((a, b) => {
        const byExchange = (a.exchangeId ?? '').localeCompare(b.exchangeId ?? '')
        if (byExchange !== 0) return byExchange

        const byCurrency = (a.currency ?? '').localeCompare(b.currency ?? '')
        if (byCurrency !== 0) return byCurrency

        return a.id - b.id
      }),
    [assignmentsQuery.data],
  )

  return (
    <div className="page-wrap">
      <h1 className="page-title">Управление правилами</h1>
      <p className="page-subtitle">
        Здесь правило назначается на биржу и валюту. Биржа выбирается из backend-списка, а
        валюта вводится свободно с подсказками по кодам, которые уже приходили по WebSocket.
      </p>

      <div className="toolbar-row">
        <button
          className="formula-button magnetic"
          type="button"
          disabled={!ruleSetsQuery.data?.length}
          onClick={() => {
            setEditingAssignment(null)
            setAssignmentDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Создать назначение
        </button>
      </div>

      <section className="formulas-table" aria-label="Список назначений">
        <div
          className="formulas-head"
          style={{ gridTemplateColumns: '1.1fr 170px 170px 170px 190px' }}
        >
          <span>Область действия</span>
          <span className="formula-action">Биржа</span>
          <span className="formula-action">Валюта</span>
          <span className="formula-action">Правило</span>
          <span className="formula-action">Действия</span>
        </div>
        <div className="formulas-body">
          {assignments.length === 0 ? (
            <div
              className="formula-row"
              style={{ gridTemplateColumns: '1.1fr 170px 170px 170px 190px' }}
            >
              <span className="formula-name">Назначений пока нет</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
              <span className="formula-action">—</span>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="formula-row"
                style={{ gridTemplateColumns: '1.1fr 170px 170px 170px 190px' }}
              >
                <span className="formula-name">{describeAssignmentScope(assignment)}</span>
                <span className="formula-action">{assignment.exchangeId ?? 'Любая'}</span>
                <span className="formula-action">{assignment.currency ?? 'Любая'}</span>
                <span className="formula-action">
                  {ruleSetTitles.get(assignment.ruleSetId) ?? `#${assignment.ruleSetId}`}
                </span>
                <span className="formula-action gap-3">
                  <ActionIconButton
                    tone="edit"
                    label="Изменить назначение"
                    onClick={() => {
                      setEditingAssignment(assignment)
                      setAssignmentDialogOpen(true)
                    }}
                  >
                    <PencilLine className="size-5" />
                  </ActionIconButton>
                  <ActionIconButton
                    tone="trash"
                    label="Удалить назначение"
                    onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                  >
                    <Trash2 className="size-5" />
                  </ActionIconButton>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <RuleAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        initialAssignment={editingAssignment}
        ruleSets={ruleSetsQuery.data ?? []}
        exchanges={exchangesQuery.data ?? []}
        defaultRuleSetId={ruleSetsQuery.data?.[0]?.id ?? null}
        isPending={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
        onRefreshExchanges={() => exchangesQuery.refetch()}
        onSubmit={(values) => {
          if (editingAssignment) {
            updateAssignmentMutation.mutate(
              {
                assignmentId: editingAssignment.id,
                payload: { ruleSetId: values.ruleSetId },
              },
              {
                onSuccess: () => {
                  setAssignmentDialogOpen(false)
                  setEditingAssignment(null)
                },
              },
            )
            return
          }

          createAssignmentMutation.mutate(values, {
            onSuccess: () => {
              setAssignmentDialogOpen(false)
            },
          })
        }}
      />
    </div>
  )
}
