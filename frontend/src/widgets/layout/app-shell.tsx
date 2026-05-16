import type { PropsWithChildren } from 'react'

import { TopNav } from '@/widgets/layout/top-nav'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_22%),radial-gradient(circle_at_100%_20%,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.9),transparent_36%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:52px_52px] opacity-20" />
      <div className="relative">
        <TopNav />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
