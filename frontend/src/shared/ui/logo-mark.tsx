import { cn } from '@/lib/utils'

export function LogoMark({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  if (compact) {
    return <span className={cn('logo-crop dashboard-logo', className)} aria-hidden="true" />
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="logo-crop dashboard-logo" aria-hidden="true" />
    </div>
  )
}
