import { useEffect, useMemo, useState } from 'react'

import { motion } from 'framer-motion'
import { PencilLine, Plus, Tags, Trash2, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RuleAssignment } from '@/entities/rule-assignment/types'
import type { RuleSet } from '@/entities/rule-set/types'
import { useExchangesQuery } from '@/features/exchanges/api/use-exchanges'
import {
  useCreateRuleAssignmentMutation,
  useDeleteRuleAssignmentMutation,
  useRuleAssignmentsQuery,
  useUpdateRuleAssignmentMutation,
} from '@/features/rule-assignments/api/use-rule-assignments'
import { RuleAssignmentDialog } from '@/features/rule-assignments/components/rule-assignment-dialog'
import {
  useCreateRuleSetMutation,
  useDeleteRuleSetMutation,
  useLinkRuleMutation,
  useRuleSetRulesQuery,
  useRuleSetsQuery,
  useUnlinkRuleMutation,
  useUpdateRuleSetMutation,
} from '@/features/rule-sets/api/use-rule-sets'
import { LinkRuleDialog } from '@/features/rule-sets/components/link-rule-dialog'
import { RuleSetFormDialog } from '@/features/rule-sets/components/rule-set-form-dialog'
import { useRulesQuery } from '@/features/rules/api/use-rules'
import { cn } from '@/lib/utils'
import { formatDecimal } from '@/shared/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'

function describeAssignmentScope(assignment: RuleAssignment) {
  const exchange = assignment.exchangeId ?? 'Любая биржа'
  const currency = assignment.currency ?? 'Любая валюта'
  return `${exchange} / ${currency}`
}

export function RuleSetsPage() {
  const ruleSetsQuery = useRuleSetsQuery()
  const rulesQuery = useRulesQuery()
  const exchangesQuery = useExchangesQuery()
  const assignmentsQuery = useRuleAssignmentsQuery()

  const createMutation = useCreateRuleSetMutation()
  const updateMutation = useUpdateRuleSetMutation()
  const deleteMutation = useDeleteRuleSetMutation()
  const createAssignmentMutation = useCreateRuleAssignmentMutation()
  const updateAssignmentMutation = useUpdateRuleAssignmentMutation()
  const deleteAssignmentMutation = useDeleteRuleAssignmentMutation()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RuleSet | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<RuleAssignment | null>(null)

  useEffect(() => {
    if (selectedId == null && ruleSetsQuery.data?.length) {
      setSelectedId(ruleSetsQuery.data[0].id)
    }
  }, [ruleSetsQuery.data, selectedId])

  const selectedRuleSet = ruleSetsQuery.data?.find((set) => set.id === selectedId) ?? null
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Наборы правил</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-white">
          Сгруппируйте правила в наборы
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
          Наборы определяют, какие правила применяются вместе, а назначения ниже связывают их с
          биржами и валютами. Backend следит, чтобы интервалы цен внутри одного набора не
          пересекались.
        </p>
      </motion.div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.7fr]">
        <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 backdrop-blur-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="font-heading text-2xl text-white">Список</CardTitle>
            <Button
              className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              Создать
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ruleSetsQuery.data?.length === 0 ? (
              <EmptyState
                title="Наборов нет"
                description="Создайте первый набор, чтобы группировать правила."
              />
            ) : (
              <ul className="space-y-2">
                {ruleSetsQuery.data?.map((set) => (
                  <li key={set.id}>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-2xl border px-3 py-2 transition',
                        selectedId === set.id
                          ? 'border-cyan-300/40 bg-cyan-300/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10',
                      )}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => setSelectedId(set.id)}
                      >
                        <p className="text-sm font-semibold text-white">{set.title}</p>
                        <p className="font-mono text-xs text-slate-400">#{set.id}</p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-xl border border-white/10 bg-white/5"
                        onClick={() => {
                          setEditing(set)
                          setFormOpen(true)
                        }}
                      >
                        <PencilLine className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-xl border border-white/10 bg-white/5"
                        onClick={() => {
                          deleteMutation.mutate(set.id, {
                            onSuccess: () => {
                              if (selectedId === set.id) setSelectedId(null)
                            },
                          })
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 backdrop-blur-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Правила в наборе</p>
              <CardTitle className="font-heading text-2xl text-white">
                {selectedRuleSet?.title ?? 'Выберите набор'}
              </CardTitle>
            </div>
            <Button
              className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              disabled={!selectedRuleSet}
              onClick={() => setLinkOpen(true)}
            >
              <Plus className="size-4" />
              Привязать правило
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedRuleSet ? (
              <EmptyState
                title="Набор не выбран"
                description="Выберите набор слева, чтобы увидеть привязанные правила."
              />
            ) : setRulesQuery.data?.length === 0 ? (
              <EmptyState
                title="Правил в наборе пока нет"
                description="Привяжите существующее правило к этому набору."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-slate-400">Название</TableHead>
                      <TableHead className="text-slate-400">Extra</TableHead>
                      <TableHead className="text-slate-400">Low</TableHead>
                      <TableHead className="text-slate-400">High</TableHead>
                      <TableHead className="text-right text-slate-400">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {setRulesQuery.data?.map((rule) => (
                      <TableRow key={rule.id} className="border-white/8 hover:bg-white/5">
                        <TableCell className="text-white">{rule.title}</TableCell>
                        <TableCell className="text-slate-300">{rule.extra}</TableCell>
                        <TableCell className="text-slate-300">{formatDecimal(rule.low)}</TableCell>
                        <TableCell className="text-slate-300">{formatDecimal(rule.high)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-xl border border-white/10 bg-white/5"
                              onClick={() => unlinkMutation.mutate(rule.id)}
                            >
                              <Unlink className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-[2rem] border-white/10 bg-slate-950/80 backdrop-blur-2xl">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Назначения</p>
              <CardTitle className="font-heading text-2xl text-white">
                Связка наборов с биржами и валютами
              </CardTitle>
              <p className="max-w-3xl text-sm text-slate-400">
                Можно создать точечное назначение для пары биржа/валюта или оставить одно из
                полей пустым. Период действия задаётся в формате ДД.ММ и повторяется каждый год.
              </p>
            </div>
            <Button
              className="rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              disabled={!ruleSetsQuery.data?.length}
              onClick={() => {
                setEditingAssignment(null)
                setAssignmentDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Создать назначение
            </Button>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <EmptyState
                title="Назначений пока нет"
                description="Создайте первое назначение, чтобы backend начал подбирать набор правил по бирже и валюте."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-slate-400">Scope</TableHead>
                      <TableHead className="text-slate-400">Биржа</TableHead>
                      <TableHead className="text-slate-400">Валюта</TableHead>
                      <TableHead className="text-slate-400">Период</TableHead>
                      <TableHead className="text-slate-400">Набор правил</TableHead>
                      <TableHead className="text-right text-slate-400">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id} className="border-white/8 hover:bg-white/5">
                        <TableCell className="font-mono text-xs text-slate-300">
                          {describeAssignmentScope(assignment)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {assignment.exchangeId ?? 'Любая'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {assignment.currency ?? 'Любая'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {assignment.validFrom} — {assignment.validTo}
                        </TableCell>
                        <TableCell className="text-white">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm">
                            <Tags className="size-4 text-cyan-200" />
                            <span>{ruleSetTitles.get(assignment.ruleSetId) ?? `#${assignment.ruleSetId}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-xl border border-white/10 bg-white/5"
                              onClick={() => {
                                setEditingAssignment(assignment)
                                setAssignmentDialogOpen(true)
                              }}
                            >
                              <PencilLine className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-xl border border-white/10 bg-white/5"
                              onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

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

      <RuleAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        initialAssignment={editingAssignment}
        ruleSets={ruleSetsQuery.data ?? []}
        exchanges={exchangesQuery.data ?? []}
        defaultRuleSetId={selectedRuleSet?.id ?? ruleSetsQuery.data?.[0]?.id ?? null}
        isPending={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
        onSubmit={(values) => {
          if (editingAssignment) {
            updateAssignmentMutation.mutate(
              {
                assignmentId: editingAssignment.id,
                payload: {
                  ruleSetId: values.ruleSetId,
                  validFrom: values.validFrom,
                  validTo: values.validTo,
                },
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
