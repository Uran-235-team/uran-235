import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LogoMark } from '@/shared/ui/logo-mark'

export function AuthShell({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.22),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex max-w-xl flex-1 flex-col justify-between gap-12 py-10 lg:py-16">
          <div className="space-y-8">
            <Link to="/" className="inline-flex">
              <LogoMark />
            </Link>
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                Премиальная trading-консоль
              </span>
              <h1 className="font-heading max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Валютная аналитика для мониторинга на основе правил.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-400">
                Авторизация уже подключена к реальному backend. Рыночный dashboard, правила и профильные сценарии уже подготовлены под следующие backend-итерации.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['24/7', 'окна мониторинга'],
              ['Низкая задержка', 'премиальный dark-интерфейс'],
              ['Готово', 'к будущему движку правил'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <p className="font-heading text-2xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-2xl sm:p-8">
            <div className="mb-8 space-y-2">
              <h2 className="font-heading text-3xl font-semibold text-white">{title}</h2>
              <p className="text-sm leading-6 text-slate-400">{description}</p>
            </div>
            {children}
            <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
