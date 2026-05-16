import { cn } from '@/lib/utils'

export function LogoMark({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex size-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
        <div className="absolute inset-1 rounded-[1rem] border border-white/10" />
        <div className="h-5 w-5 rounded-full border border-cyan-300/80 bg-gradient-to-br from-cyan-300 to-blue-500" />
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Uran-235
          </p>
          <p className="text-xs text-slate-400">Реактор валютных правил</p>
        </div>
      ) : null}
    </div>
  )
}
