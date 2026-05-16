import type { PropsWithChildren } from 'react'

import { TopNav } from '@/widgets/layout/top-nav'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="currency-stream">
          <b>₽</b>
          <b>$</b>
          <b>€</b>
          <b>¥</b>
          <b>£</b>
          <b>₿</b>
          <b>₽</b>
          <b>$</b>
        </span>
        <span className="grain" />
        <span className="grid-dome" />
        <span className="scanline" />
      </div>

      <main className="shell">
        <section className="screen screen-dashboard is-active app-screen">
          <div className="mx-auto w-full max-w-[1240px]">
            <TopNav />
            {children}
          </div>
        </section>
      </main>
    </>
  )
}
