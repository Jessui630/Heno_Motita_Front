import { request } from './httpClient'
import type { Crew } from '../types/admin.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })

export function listManagerCurrentCrews(accessToken: string) {
  return request<{ crews: Crew[] }>('/manager/current-crews?page=1&limit=100', auth(accessToken))
}

export function getStudentCurrentCrew(accessToken: string) {
  return request<{ crew: Crew }>('/student/current-crew', auth(accessToken))
}
