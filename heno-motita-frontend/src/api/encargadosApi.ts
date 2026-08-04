import { request } from './httpClient'
import type { CreateManagerInput, Manager } from '../types/admin.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })

export function getManager(accessToken: string, managerId: string) {
  return request<{ manager: Manager }>(`/managers/${managerId}`, auth(accessToken))
}

export function updateManager(accessToken: string, managerId: string, manager: CreateManagerInput) {
  return request<{ message: string; manager: Manager }>(`/managers/${managerId}`, {
    ...auth(accessToken), method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(manager),
  })
}

export function updateManagerStatus(accessToken: string, managerId: string, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') {
  return request<{ message: string; manager: Manager }>(`/managers/${managerId}/status`, {
    ...auth(accessToken), method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
  })
}
