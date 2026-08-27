import axios from 'axios'

// Smart API URL resolution:
// 1. Explicit VITE_API_URL if set in env
// 2. Relative '/api/v1' in production / custom domain (handled seamlessly by Vercel rewrites)
// 3. 'http://localhost:8000/api/v1' when developing locally on localhost
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const defaultUrl = isLocal ? 'http://localhost:8000/api/v1' : '/api/v1'
const API_URL = (import.meta.env.VITE_API_URL as string) || defaultUrl

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      // optional refresh
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
