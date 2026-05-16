import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tone = 'stable' | 'watch' | 'alert' | 'inactive' | 'active' | 'draft' | 'disabled'

const toneClassNames: Record<Tone, string> = {
  stable: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  watch: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  alert: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  inactive: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
  active: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  draft: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  disabled: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
}

export function StatusPill({
  tone,
  children,
}: {
  tone: Tone
  children: ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide capitalize',
        toneClassNames[tone],
      )}
    >
      {children}
    </Badge>
  )
}
