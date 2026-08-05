export type UserRole = 'SUPER_ADMIN' | 'CREW_MANAGER' | 'STUDENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  message: string
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: string
  user: User
}
