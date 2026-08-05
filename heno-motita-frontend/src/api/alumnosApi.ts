import { request } from './httpClient'
import type { Membership, Student, StudentInput } from '../types/resources.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })
const json = (accessToken: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) => ({ method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export function activateStudent(email: string, activationCode: string, password: string) { return request<{ message: string; student: Student }>('/auth/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, activationCode, password }) }) }
export function registerStudentsBatch(accessToken: string, crewId: string, students: StudentInput[]) { return request<{ message: string; crewId: string; registered: number; credentials: Array<StudentInput & { studentId: string; activationCode: string; expiresAt: string }> }>(`/crews/${crewId}/students/batch`, json(accessToken, 'POST', { students })) }
export function listCrewStudents(accessToken: string, crewId: string) { return request<{ students: Student[] }>(`/crews/${crewId}/students?page=1&limit=100`, auth(accessToken)) }
export function getStudent(accessToken: string, studentId: string) { return request<{ student: Student }>(`/students/${studentId}`, auth(accessToken)) }
export function updateStudent(accessToken: string, studentId: string, student: StudentInput) { return request<{ message: string; student: Student }>(`/students/${studentId}`, json(accessToken, 'PUT', student)) }
export function updateStudentStatus(accessToken: string, studentId: string, status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED') { return request<{ message: string; student: Student }>(`/students/${studentId}/status`, json(accessToken, 'PATCH', { status })) }
export function generateActivationCode(accessToken: string, studentId: string) { return request<{ message: string; credential: { email: string; activationCode: string; expiresAt: string } }>(`/students/${studentId}/new-activation-code`, json(accessToken, 'POST', {})) }
export function getStudentMemberships(accessToken: string, studentId: string) { return request<{ student: Student; memberships: Membership[]; total: number }>(`/students/${studentId}/memberships`, auth(accessToken)) }
export function reactivateStudent(accessToken: string, crewId: string, studentId: string) { return request<{ message: string; data: { student: Student; membership: Membership; credential: { email: string; activationCode: string; expiresAt: string } } }>(`/crews/${crewId}/students/${studentId}/reactivate`, json(accessToken, 'POST', {})) }
