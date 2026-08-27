import axios from 'axios'

// Smart API URL resolution:
// Handles explicit VITE_API_URL, localhost, and production relative routes
function getBaseApiUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string)?.trim()
  if (envUrl) {
    let clean = envUrl.replace(/\/+$/, '')
    // If user provided origin only without /api/v1 (e.g. https://staflo-backend.vercel.app), append /api/v1
    if (!clean.endsWith('/api/v1') && !clean.endsWith('/v1') && !clean.endsWith('/api')) {
      clean = `${clean}/api/v1`
    }
    return clean
  }
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  return isLocal ? 'http://localhost:8000/api/v1' : '/api/v1'
}

export const API_URL = getBaseApiUrl()
export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Only clear token if the core auth check fails or token is explicitly invalid
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)
