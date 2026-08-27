import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react'

export default function Verify() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setState('error')
      setMessage('No verification token found in the link.')
      return
    }
    (async () => {
      try {
        const { data } = await api.post('/auth/verify-email', { token })
        if (!cancelled) {
          setState('success')
          setMessage(data.email ? `${data.email} is verified.` : 'Your email is verified.')
        }
      } catch (ex: any) {
        if (!cancelled) {
          setState('error')
          setMessage(ex.response?.data?.detail || 'This verification link is invalid or has expired.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const resend = async () => {
    setResending(true); setResent(false)
    try {
      await api.post('/auth/resend-verification', { email })
      setResent(true)
    } catch { /* generic response either way */ }
    finally { setResending(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c1917] via-[#092634] to-[#004E72] p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#004E72] via-[#fcd34d] to-[#e0b64c]" />
        <div className="p-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.svg" alt="Staflo logo" className="h-9 w-9 rounded-xl" />
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">Staflo</span>
          </Link>

          {state === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#004E72]" />
              <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Verifying your email…</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Hang on a second while we confirm your account.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="h-14 w-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Email verified</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center w-full h-11 rounded-xl bg-[#004E72] hover:bg-[#5d3d55] text-white text-sm font-semibold transition-colors"
              >
                Continue to Sign In
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="h-14 w-14 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Verification failed</h1>
              <p className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 leading-relaxed">{message}</p>

              {resent ? (
                <div className="mt-6 flex items-start gap-2 text-left text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                  <MailCheck className="h-4 w-4 mt-0.5 shrink-0" />
                  If that account needs verification, a new link has been sent — check your inbox.
                </div>
              ) : (
                <div className="mt-6 space-y-3 text-left">
                  <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Request a new verification link</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004E72]/40"
                  />
                  <button
                    onClick={resend}
                    disabled={!email.trim() || resending}
                    className="w-full h-10 rounded-xl bg-[#004E72] hover:bg-[#5d3d55] disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {resending ? 'Sending…' : 'Resend verification email'}
                  </button>
                </div>
              )}

              <Link to="/login" className="mt-4 inline-block text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">← Back to Sign In</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
