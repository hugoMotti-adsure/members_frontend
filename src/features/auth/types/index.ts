export type UserRole = 'super_admin' | 'owner' | 'admin' | 'instructor' | 'student'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  tenant_id?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  tenant_id?: string
}

export interface AuthResponse {
  user: User
  access_token: string
}
