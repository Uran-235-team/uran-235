import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getCurrentUser,
  login,
  logout,
  register,
} from '@/services/api/auth-api'

export const currentUserQueryKey = ['auth', 'me']

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
  })
}

export function useLoginMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: login,
    onSuccess: async (tokens) => {
      setSession(tokens)
      const user = await queryClient.fetchQuery({
        queryKey: currentUserQueryKey,
        queryFn: getCurrentUser,
      })
      setUser(user)
      toast.success('Вход выполнен.')
      navigate('/dashboard', { replace: true })
    },
  })
}

export function useRegisterMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: register,
    onSuccess: async (tokens) => {
      setSession(tokens)
      const user = await queryClient.fetchQuery({
        queryKey: currentUserQueryKey,
        queryFn: getCurrentUser,
      })
      setUser(user)
      toast.success('Аккаунт создан.')
      navigate('/dashboard', { replace: true })
    },
  })
}

export function useLogoutMutation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearSession()
      await queryClient.invalidateQueries()
      toast.success('Вы вышли из системы.')
      navigate('/login', { replace: true })
    },
  })
}
