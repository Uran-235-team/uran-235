import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/entities/user/types'

type AuthStore = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  setSession: (payload: {
    accessToken: string
    refreshToken: string
    user?: User | null
  }) => void
  setUser: (user: User | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: user ?? state.user,
        })),
      setUser: (user) => set({ user }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        }),
    }),
    {
      name: 'uran-auth-session',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)
