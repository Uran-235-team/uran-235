import { Activity, ChartSpline, ShieldEllipsis } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { LogoMark } from '@/shared/ui/logo-mark'
import { ProfileDropdown } from '@/widgets/profile/profile-dropdown'

const links = [
  { to: '/dashboard', label: 'Дашборд', icon: ChartSpline },
  { to: '/rules', label: 'Правила', icon: ShieldEllipsis },
]

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <LogoMark />
          <nav className="hidden items-center gap-2 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition',
                    isActive
                      ? 'bg-cyan-300/10 text-cyan-100'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 lg:flex">
            <Activity className="size-4 text-emerald-300" />
            <span>Realtime-синхронизация подготовлена через сервис emulator</span>
          </div>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
