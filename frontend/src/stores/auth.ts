import { create } from 'zustand'
import { api } from '../api/client'

type User = {
  id: string
  employee_id: string
  email: string
  role: string
  company_id: string
  company_slug?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

type AuthState = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signupCompany: (data: any) => Promise<any>
  verifyOtp: (email: string, otp: string) => Promise<any>
  logout: () => void
  fetchMe: () => Promise<void>
  setUser: (u: User | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token'),
  setUser: (u) => set({ user: u }),
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ token: data.access_token, user: data.user })
  },
  signupCompany: async (payload) => {
    const { data } = await api.post('/auth/signup-company', payload)
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ token: data.access_token, user: data.user })
    }
    return data
  },
  verifyOtp: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ token: data.access_token, user: data.user })
    return data
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
  fetchMe: async () => {
    const { data } = await api.get('/auth/me')
    const mapped: User = {
      id: data.id,
      employee_id: data.employee_id,
      email: data.email,
      role: data.role,
      company_id: data.company_id,
      company_slug: data.company_slug,
      first_name: data.first_name,
      last_name: data.last_name,
    }
    localStorage.setItem('user', JSON.stringify(mapped))
    set({ user: mapped })
  }
}))
