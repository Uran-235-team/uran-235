import { NavLink } from 'react-router-dom'

import { LogoMark } from '@/shared/ui/logo-mark'
import { ProfileDropdown } from '@/widgets/profile/profile-dropdown'

const links = [
  { to: '/dashboard', label: 'Главная' },
  { to: '/rules', label: 'Условия' },
  { to: '/rule-sets', label: 'Правила' },
  { to: '/rule-assignments', label: 'Управление правилами' },
]

export function TopNav() {
  return (
    <header className="topbar">
      <NavLink className="brand-button" to="/dashboard" aria-label="Перейти на главную">
        <LogoMark compact />
      </NavLink>

      <div className="top-divider" aria-hidden="true" />

      <nav className="app-nav" aria-label="Основная навигация">
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `formula-button magnetic${isActive ? ' is-active' : ''}`}>
            {label}
          </NavLink>
        ))}
      </nav>

      <ProfileDropdown />
    </header>
  )
}
