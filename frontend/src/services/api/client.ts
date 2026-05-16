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

const detailMessageMap: Record<string, string> = {
  'A rule with this title already exists': 'Правило с таким названием уже существует.',
  'A rule set with this title already exists': 'Набор с таким названием уже существует.',
  'Username already exists': 'Пользователь с таким логином уже существует.',
  'Invalid username or password': 'Неверный логин или пароль.',
  'Refresh token has expired': 'Сессия истекла. Войдите заново.',
  'Invalid refresh token': 'Сессия недействительна. Войдите заново.',
  'Invalid token type': 'Сессия недействительна. Войдите заново.',
  'Invalid token payload': 'Сессия недействительна. Войдите заново.',
  'Refresh token has been revoked': 'Сессия была завершена. Войдите заново.',
  'Invalid token': 'Требуется повторный вход.',
  'Rule not found': 'Правило не найдено.',
  'Rule set not found': 'Набор не найден.',
  'Assignment not found': 'Назначение не найдено.',
  'Rule and rule set must belong to the same user':
    'Нельзя связать объекты из разных аккаунтов.',
  'Rule is already linked to this rule set': 'Это правило уже привязано к набору.',
  'Rule is not linked to this rule set': 'Это правило не привязано к набору.',
  'Price range overlaps another rule in this rule set':
    'Диапазон цены пересекается с другим правилом в наборе.',
  'Price range overlaps another rule in a linked rule set':
    'Диапазон цены пересекается с другим правилом в связанном наборе.',
  'Cannot link rule': 'Не удалось привязать правило.',
  'low and high must be positive': 'Проверьте диапазон цены: значения должны быть больше нуля.',
  'high must be greater than low': 'Верхняя граница должна быть больше нижней.',
  'Invalid exchange_id': 'Некорректный идентификатор биржи.',
  'Exchange is not connected': 'Биржа сейчас недоступна.',
  'Auto-rules model is unavailable': 'Модель ИИ сейчас недоступна.',
  'Failed to generate auto-rules': 'Не удалось сгенерировать ИИ-правила.',
  'Failed to persist auto-generated rules': 'Не удалось сохранить сгенерированные ИИ-правила.',
}

let refreshPromise: Promise<string | null> | null = null

export function refreshSessionTokens() {
  const refreshToken = useAuthStore.getState().refreshToken

  if (!refreshToken) {
    useAuthStore.getState().clearSession()
    return Promise.resolve(null)
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

  return refreshPromise
}

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

    const nextAccessToken = await refreshSessionTokens()

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
    const status = error.response?.status
    const detail = error.response?.data?.detail
    const requestUrl = String(error.config?.url ?? '')

    if (error.code === 'ECONNABORTED') {
      return new Error('Сервер отвечает слишком долго. Попробуйте ещё раз.')
    }

    if (!error.response) {
      return new Error('Не удалось связаться с сервером. Попробуйте ещё раз.')
    }

    if (Array.isArray(detail)) {
      return new Error('Проверьте заполнение полей и попробуйте ещё раз.')
    }

    if (typeof detail === 'string' && detailMessageMap[detail]) {
      return new Error(detailMessageMap[detail])
    }

    if (status === 400 || status === 422) {
      return new Error('Проверьте введённые данные и попробуйте ещё раз.')
    }

    if (status === 401) {
      if (requestUrl.includes('/auth/login')) {
        return new Error('Неверный логин или пароль.')
      }

      return new Error('Сессия истекла. Войдите заново.')
    }

    if (status === 403) {
      return new Error('У вас нет доступа к этому действию.')
    }

    if (status === 404) {
      return new Error('Запрошенные данные не найдены.')
    }

    if (status === 409) {
      return new Error('Такое действие сейчас недоступно из-за конфликта данных.')
    }

    if (status != null && status >= 500) {
      return new Error('На сервере произошла ошибка. Попробуйте ещё раз позже.')
    }

    return new Error('Не удалось выполнить запрос. Попробуйте ещё раз.')
  }

  return error instanceof Error ? error : new Error('Произошла непредвиденная ошибка.')
}
