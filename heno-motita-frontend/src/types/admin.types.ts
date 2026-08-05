import type { User } from './auth.types'

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Manager extends User {
  phone?: string
  institution?: string
}

export interface Crew {
  id: string
  name: string
  description: string
  zone: string
  institution: string
  managerId: string
  manager?: Pick<Manager, 'id' | 'name' | 'email'>
  startAt: string
  endAt: string
  studentLimit: number
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED'
}

export interface StudentHistoryItem {
  student: Pick<User, 'id' | 'name' | 'email' | 'status'> & { enrollment?: string }
  totalMemberships: number
  latestMembership?: { status: string; crew?: Pick<Crew, 'id' | 'name'> }
}

export interface ManagerListResponse {
  managers: Manager[]
  pagination: Pagination
}

export interface CrewListResponse {
  crews: Crew[]
  pagination: Pagination
}

export interface StudentHistoryListResponse {
  students: StudentHistoryItem[]
  pagination: Pagination
}

export interface CreateManagerInput {
  name: string
  email: string
  password: string
  phone: string
  institution: string
}
