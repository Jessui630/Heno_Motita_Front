import { request } from './httpClient'
import type {
  CreateManagerInput,
  CrewListResponse,
  Manager,
  ManagerListResponse,
  StudentHistoryListResponse,
} from '../types/admin.types'

function withAuth(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } }
}

export function listManagers(accessToken: string) {
  return request<ManagerListResponse>('/managers?page=1&limit=100', withAuth(accessToken))
}

export function createManager(accessToken: string, manager: CreateManagerInput) {
  return request<{ message: string; manager: Manager }>('/managers', {
    ...withAuth(accessToken),
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(manager),
  })
}

export function listCrews(accessToken: string) {
  return request<CrewListResponse>('/crews?page=1&limit=100', withAuth(accessToken))
}

export function listStudentHistory(accessToken: string) {
  return request<StudentHistoryListResponse>('/students/history?page=1&limit=100', withAuth(accessToken))
}
