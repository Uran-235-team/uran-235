import { apiClient, rawApiClient } from '@/services/api/client'
import type { User } from '@/entities/user/types'

type AuthResponseDto = {
  access_token: string
  refresh_token: string
  token_type: string
}

type UserResponseDto = {
  username: string
  email: string
  full_name: string
  is_active: boolean
}

type LoginPayload = {
  username: string
  password: string
}

type RegisterPayload = {
  username: string
  email: string
  fullName: string
  password: string
}

function mapUser(user: UserResponseDto): User {
  return {
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    isActive: user.is_active,
  }
}

function mapTokens(response: AuthResponseDto) {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponseDto>('/api/v1/auth/login', payload)
  return mapTokens(response.data)
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<AuthResponseDto>('/api/v1/auth/register', {
    username: payload.username,
    email: payload.email,
    full_name: payload.fullName,
    password: payload.password,
  })
  return mapTokens(response.data)
}

export async function getCurrentUser() {
  const response = await apiClient.get<UserResponseDto>('/api/v1/auth/me')
  return mapUser(response.data)
}

export async function logout() {
  await apiClient.post('/api/v1/auth/logout')
}

export async function refreshSession(refreshToken: string) {
  const response = await rawApiClient.post<AuthResponseDto>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  })

  return mapTokens(response.data)
}
