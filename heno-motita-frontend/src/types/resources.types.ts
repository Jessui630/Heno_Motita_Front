import type { Crew, Manager, Pagination } from './admin.types'
import type { User, UserRole } from './auth.types'

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type CrewStatus = 'PENDING' | 'ACTIVE' | 'FINISHED' | 'CANCELLED'
export type TreeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type ObservationStatus = 'ACTIVE' | 'ARCHIVED'

export interface CrewInput {
  name: string
  description: string
  zone: string
  institution: string
  managerId: string
  startAt: string
  endAt: string
  studentLimit: number
}

export interface Student {
  id: string
  name: string
  email: string
  enrollment: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface StudentInput {
  name: string
  email: string
  enrollment: string
}

export interface ActivationCredential extends StudentInput {
  studentId: string
  activationCode: string
  expiresAt: string
}

export interface Membership {
  id: string
  crewId: string
  studentId: string
  status: string
  validFrom: string
  validUntil: string
  crew?: Pick<Crew, 'id' | 'name' | 'zone' | 'institution' | 'status' | 'startAt' | 'endAt'>
}

export interface TreeInput {
  code: string
  commonName: string
  scientificName: string
  latitude: number
  longitude: number
  locationDescription: string
}

export interface Tree extends TreeInput {
  id: string
  crewId: string
  status: TreeStatus
  registeredById: string
  registeredBy?: Pick<User, 'id' | 'name' | 'email' | 'role'>
}

export interface ObservationInput {
  lowerThirdScore: 0 | 1 | 2
  middleThirdScore: 0 | 1 | 2
  upperThirdScore: 0 | 1 | 2
  notes: string
  observationDate: string
  latitude?: number
  longitude?: number
}

export interface Observation extends ObservationInput {
  id: string
  treeId: string
  crewId: string
  observerId: string
  status: ObservationStatus
  hawksworth: ObservationInput & { totalScore: number; minimumScore: 0; maximumScore: 6; maximumByThird: 2 }
}

export interface ObservationImage {
  id: string
  observationId: string
  secureUrl: string
  originalFilename: string
  mimeType: string
  description?: string
  bytes: number
  createdAt: string
}

export interface ListResponse<T> {
  pagination: Pagination
  [key: string]: Pagination | T[]
}

export interface ManagerResponse { manager: Manager }
export interface CrewResponse { crew: Crew }
export interface StudentResponse { student: Student }
export interface TreeResponse { tree: Tree }
export interface ObservationResponse { observation: Observation }
export interface ImageResponse { image: ObservationImage }
export interface UserResponse { user: User }
export interface PortalResponse { user?: User; role?: UserRole }
