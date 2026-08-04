import { request } from './httpClient'
import type { LoginResponse, User } from '../types/auth.types'

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function loginStudentWithToken(token: string) {
  return request<LoginResponse>('/auth/student-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export function getCurrentUser(accessToken: string) {
  return request<{ message: string; user: User }>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
