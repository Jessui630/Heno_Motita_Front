import { request } from './httpClient'
import type { Crew, CrewListResponse } from '../types/admin.types'
import type { CrewInput } from '../types/resources.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })
const json = (accessToken: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) => ({ method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export function listCrewsForUser(accessToken: string) { return request<CrewListResponse>('/crews?page=1&limit=100', auth(accessToken)) }
export function getCrew(accessToken: string, crewId: string) { return request<{ crew: Crew }>(`/crews/${crewId}`, auth(accessToken)) }
export function createCrew(accessToken: string, crew: CrewInput) { return request<{ message: string; crew: Crew }>('/crews', json(accessToken, 'POST', crew)) }
export function updateCrew(accessToken: string, crewId: string, crew: CrewInput) { return request<{ message: string; crew: Crew }>(`/crews/${crewId}`, json(accessToken, 'PUT', crew)) }
export function updateCrewStatus(accessToken: string, crewId: string, status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED') { return request<{ message: string; crew: Crew }>(`/crews/${crewId}/status`, json(accessToken, 'PATCH', { status })) }
