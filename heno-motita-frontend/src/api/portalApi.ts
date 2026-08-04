import { request } from './httpClient'
import type { Crew } from '../types/admin.types'
import type { User } from '../types/auth.types'

const auth = (accessToken: string) => ({ headers: { Authorization: `Bearer ${accessToken}` } })

export function listManagerCurrentCrews(accessToken: string) {
  return request<{ crews: Array<{ crew: Crew; stats: CrewStats }> }>('/manager/current-crews?page=1&limit=50', auth(accessToken))
}

export function getStudentCurrentCrew(accessToken: string) {
  return request<{ crew: Crew; stats: CrewStats }>('/student/current-crew', auth(accessToken))
}

export interface CrewStats { students: number; trees: number; observations: number; images: number }

export interface ManagerDashboard {
  manager: Pick<User, 'id' | 'name' | 'email' | 'role' | 'status'>
  summary: { assignedCrews: number; pendingCrews: number; activeCrews: number; finishedCrews: number; cancelledCrews: number; currentStudents: number; currentTrees: number; currentObservations: number; currentImages: number }
  currentCrews: Array<{ crew: Crew; stats: CrewStats }>
}

export interface StudentProfile {
  student: Pick<User, 'id' | 'name' | 'email' | 'role' | 'status'> & { enrollment: string }
  currentCrew?: Crew
}

export interface StudentPortalTree {
  id: string
  crewId: string
  code: string
  commonName: string
  scientificName: string
  latitude: number
  longitude: number
  locationDescription?: string
  status: 'ACTIVE'
  registeredBy: string
  registeredByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface StudentPortalObservation {
  id: string
  treeId: string
  crewId: string
  tree?: Pick<StudentPortalTree, 'id' | 'code' | 'commonName' | 'scientificName'>
  lowerThirdScore: number
  middleThirdScore: number
  upperThirdScore: number
  totalScore: number
  notes?: string
  observationDate: string
  status: 'ACTIVE'
}

export function getManagerDashboard(accessToken: string) { return request<ManagerDashboard>('/manager/dashboard', auth(accessToken)) }
export function getStudentProfile(accessToken: string) { return request<StudentProfile>('/student/profile', auth(accessToken)) }
export function listStudentPortalTrees(accessToken: string, search = '') { return request<{ trees: StudentPortalTree[] }>(`/student/trees?page=1&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`, auth(accessToken)) }
export function listStudentPortalObservations(accessToken: string, treeId = '') { return request<{ observations: StudentPortalObservation[] }>(`/student/observations?page=1&limit=50${treeId ? `&treeId=${encodeURIComponent(treeId)}` : ''}`, auth(accessToken)) }
