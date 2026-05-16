import { useEffect, useMemo, useState } from 'react'

import { LoaderCircle } from 'lucide-react'

import { useCurrentUserQuery, useLogoutMutation } from '@/features/auth/api/use-auth'
import { useAuthStore } from '@/features/auth/model/auth-store'

function initialsFromName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'A'
  return trimmed.charAt(0).toUpperCase()
}

export function ProfileDropdown() {
  const { data, isLoading } = useCurrentUserQuery()
  const setUser = useAuthStore((state) => state.setUser)
  const persistedUser = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  const user = data ?? persistedUser
  const displayName = user?.username ?? 'Оператор'
  const initials = useMemo(() => initialsFromName(displayName), [displayName])

  return (
    <div className={`profile-menu${open ? ' is-open' : ''}`}>
      <button
        className="profile-button magnetic"
        type="button"
        aria-label="Профиль"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Профиль</span>
        <i className="coin-badge" aria-hidden="true">
          $
        </i>
        <strong>{initials}</strong>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 9.5 12 14l5-4.5" />
        </svg>
      </button>

      <div className="profile-dropdown" role="menu">
        <div className="profile-row" role="menuitem">
          <span>{isLoading ? 'Загрузка профиля…' : displayName}</span>
        </div>
        <button
          type="button"
          role="menuitem"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Выход…
            </>
          ) : (
            'Выйти'
          )}
        </button>
      </div>
    </div>
  )
}
