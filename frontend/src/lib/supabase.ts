import { createClient } from '@supabase/supabase-js'

// Supabase client for frontend (used for Storage public URL helpers, Realtime future)
// FastAPI remains source of truth for auth (JWT), Supabase is DB + Storage backend
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && anon ? createClient(url, anon) : null

export const isSupabaseConfigured = !!supabase
