import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: 'super_admin' | 'owner' | 'admin' | 'instructor' | 'student'
  tenant_id?: string
  tenant?: {
    id: string
    name: string
    slug: string
    logo_url?: string
    logo_horizontal_url?: string
    logo_icon_url?: string
    primary_color?: string
  }
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, tenantId?: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string, tenantId?: string) => {
    const body: { email: string; password: string; tenant_id?: string } = { email, password }
    if (tenantId) body.tenant_id = tenantId
    const response = await api.post('/auth/login', body)
    const { user, access_token } = response.data

    localStorage.setItem('access_token', access_token)
    if (user.tenant?.id) {
      localStorage.setItem('tenant_id', user.tenant.id)
    }

    set({ user })
  },

  register: async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password })
  },

  logout: async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('tenant_id')
    set({ user: null })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      set({ user: response.data, isLoading: false })
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('tenant_id')
      set({ user: null, isLoading: false })
    }
  },

  updateUser: (data: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      set({ user: { ...currentUser, ...data } })
    }
  },
}))
