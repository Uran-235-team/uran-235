import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <div className="space-y-2">
          <h3 className="font-heading text-xl font-semibold text-white">{title}</h3>
          <p className="max-w-md text-sm text-slate-400">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
