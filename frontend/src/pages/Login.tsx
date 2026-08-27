import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { api } from '../api/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Eye, EyeOff, ArrowRight, Check, ShieldCheck, Lock
} from 'lucide-react'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPw,setShowPw]=useState(false)
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const [resending,setResending]=useState(false)
  const [resent,setResent]=useState(false)
  const { login } = useAuth()
  const nav = useNavigate()
  const notVerified = err.toLowerCase().includes('not verified')

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault(); setErr(''); setResent(false); setLoading(true)
    try{ await login(email,password); nav('/dashboard') } catch(ex:any){ setErr(ex.response?.data?.detail || 'Invalid credentials — check Login ID/Email and Password')}
    finally{ setLoading(false)}
  }

  const resend = async()=>{
    if(!email) return
    setResending(true); setErr('')
    try{ await api.post('/auth/resend-verification',{ email }); setResent(true) }
    catch{ setErr('Could not resend verification email — please try again') }
    finally{ setResending(false)}
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-[#fcfbf9] dark:bg-stone-950 font-sans">
      {/* Left — Executive Branding */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-stone-900 text-white flex-col shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800" />
        <div className="absolute -top-24 -right-24 h-[560px] w-[560px] rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[90px]" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs text-sm">
              DF
            </span>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Daily<span className="text-amber-500 font-black">Flow</span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-[480px]">
            <div className="text-[11px] tracking-wider font-extrabold text-amber-500 uppercase">Enterprise Workforce System</div>
            <h1 className="mt-3 text-[38px] xl:text-[42px] font-black tracking-tight leading-[1.02]">
              Lead your workforce<br />
              <span className="font-light text-amber-400 italic">with complete alignment.</span>
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-stone-300">
              One unified platform for workforce directory, attendance verification, time-off approvals, compensation structures, and live analytics.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Real-time attendance & GPS verification',
                'Printable salary slips & compensation rules',
                'Multi-tenant cloud PostgreSQL security',
              ].map(t=>(
                <div key={t} className="flex items-center gap-3 text-xs font-semibold text-stone-200">
                  <span className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0"><Check className="h-3.5 w-3.5 text-amber-400" /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 pt-6 border-t border-stone-800 shrink-0 font-medium">
            <span>© 2026 DailyFlow Technologies</span>
            <span className="flex items-center gap-3"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Secure</span><span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-amber-500" /> Private</span></span>
          </div>
        </div>
      </div>

      {/* Right — Login Card */}
      <div className="flex-1 lg:w-[50%] lg:shrink-0 flex flex-col bg-[#fcfbf9] dark:bg-stone-950 lg:p-6 xl:p-8">
        <div className="lg:hidden h-16 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between px-4 shrink-0">
          <Link to="/" className="flex items-center gap-2 font-extrabold"><span className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xs">DF</span> DailyFlow</Link>
          <Link to="/signup" className="text-xs text-amber-700 font-bold">Create Company</Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-0 h-full">
          <div className="w-full max-w-[420px] bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm p-6 sm:p-8 flex flex-col max-h-full overflow-auto">
            <div className="space-y-1.5 shrink-0">
              <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">Welcome back</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Sign in to your organization workspace.</p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Login ID / Work Email</label>
                <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="DF0001 or admin@company.com" required autoComplete="username" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Password</label>
                  <button type="button" className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer" onClick={()=> alert('Please contact your System Administrator to reset credentials via invite flow.')}>Forgot?</button>
                </div>
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="h-11 pr-10" placeholder="••••••••" />
                  <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-stone-400" />}
                  </button>
                </div>
              </div>

              {err && (
                <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 rounded-2xl font-medium">
                  <div>{err}</div>
                  {notVerified && !resent && (
                    <button type="button" onClick={resend} disabled={resending} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline disabled:opacity-60 cursor-pointer">
                      ↻ {resending ? 'Sending…' : 'Resend verification email'}
                    </button>
                  )}
                  {resent && <div className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">✓ Verification email sent — check your inbox.</div>}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 text-xs font-bold rounded-2xl">
                {loading ? 'Signing in...' : <><span>Sign In</span> <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200 dark:border-stone-800" /></div>
                <div className="relative flex justify-center"><span className="bg-white dark:bg-stone-900 px-3 text-[11px] font-semibold text-stone-400">New to DailyFlow?</span></div>
              </div>

              <div className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
                No company yet? <Link to="/signup" className="text-amber-700 dark:text-amber-400 font-bold hover:underline">Create Company — Free</Link>
              </div>
            </form>

            <div className="mt-6 text-center text-[11px] text-stone-400 shrink-0">
              Protected by Enterprise Role-Based Access Control.
            </div>

            <div className="hidden lg:flex mt-3 items-center justify-center gap-2 text-xs text-stone-400 shrink-0 font-medium">
              <Link to="/" className="hover:text-stone-700 dark:hover:text-stone-300">← Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

