import axios from 'axios'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { env } from '@/shared/config/env'

export const rawApiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})

let refreshPromise: Promise<string | null> | null = null

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    }

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
      throw normalizeApiError(error)
    }

    if (String(originalRequest.url).includes('/auth/login')) {
      throw normalizeApiError(error)
    }

    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) {
      useAuthStore.getState().clearSession()
      throw normalizeApiError(error)
    }

    if (!refreshPromise) {
      refreshPromise = rawApiClient
        .post('/api/v1/auth/refresh', { refresh_token: refreshToken })
        .then((response) => {
          const nextAccessToken = response.data.access_token as string
          const nextRefreshToken = response.data.refresh_token as string

          useAuthStore.getState().setSession({
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
          })

          return nextAccessToken
        })
        .catch((refreshError) => {
          useAuthStore.getState().clearSession()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const nextAccessToken = await refreshPromise

    if (!nextAccessToken) {
      throw normalizeApiError(error)
    }

    originalRequest._retry = true
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`

    return apiClient(originalRequest)
  },
)

export function normalizeApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return new Error(detail)
    }

    return new Error(error.message || 'Unexpected API error.')
  }

  return error instanceof Error ? error : new Error('Unexpected error.')
}
