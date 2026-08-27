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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-white dark:bg-zinc-950">
      {/* Left — Executive Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#1c1917] text-white flex-col shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] via-[#092634] to-[#004E72]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 h-[560px] w-[560px] rounded-full bg-white/[0.06] blur-[90px]" />
        <div className="absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-[#092634]/20 blur-[80px]" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.svg" alt="DailyFlow logo" className="h-9 w-9 rounded-xl" />
            <span className="font-bold text-xl tracking-tight">DailyFlow</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-[480px]">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-white/60">TRUSTED BY LEADERS</div>
            <h1 className="mt-3 text-[38px] xl:text-[42px] font-bold tracking-tight leading-[0.95]">
              Lead your people<br />
              <span className="font-light text-white/80 italic">with confidence.</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              One clear view of your workforce — attendance, time off and payroll — so you can make confident decisions, every day.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Complete visibility across every team',
                'Payroll that’s accurate and on time',
                'Insights that drive better decisions',
              ].map(t=>(
                <div key={t} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="h-6 w-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Check className="h-3.5 w-3.5" /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-6 border-t border-white/10 shrink-0">
            <span>© 2026 DailyFlow Technologies</span>
            <span className="flex items-center gap-3"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure</span><span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private</span></span>
          </div>
        </div>
      </div>

      {/* Right — 50% Side Panel Card */}
      <div className="flex-1 lg:w-[48%] lg:shrink-0 flex flex-col bg-zinc-50 dark:bg-zinc-950 lg:bg-white lg:dark:bg-zinc-950 lg:p-4 xl:p-5">
        <div className="lg:hidden h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0">
          <Link to="/" className="flex items-center gap-2 font-bold"><img src="/logo.svg" alt="DailyFlow logo" className="h-7 w-7 rounded-lg" /> DailyFlow</Link>
          <Link to="/signup" className="text-sm text-[#004E72] font-medium">Create Company</Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-0 h-full">
          <div className="w-full max-w-[440px] bg-white dark:bg-zinc-900 lg:rounded-2xl lg:border lg:border-zinc-200 lg:dark:border-zinc-800 lg:shadow-sm p-6 sm:p-8 flex flex-col max-h-full overflow-auto">
              <div className="space-y-1.5 shrink-0">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome back</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Sign in to your company workspace.</p>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4 flex-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Login ID / Email</label>
                  <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="OS0001 or email@company.com" required autoComplete="username" className="h-11" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                    <button type="button" className="text-xs text-[#004E72] hover:underline" onClick={()=> alert('Please contact your Admin to reset password via invite flow.')}>Forgot?</button>
                  </div>
                  <div className="relative">
                    <Input type={showPw ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="h-11 pr-10" placeholder="••••••••" />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {err && (
                  <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-xl">
                    <div>{err}</div>
                    {notVerified && !resent && (
                      <button type="button" onClick={resend} disabled={resending} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#004E72] dark:text-[#c9a3bd] hover:underline disabled:opacity-60">
                        ↻ {resending ? 'Sending…' : 'Resend verification email'}
                      </button>
                    )}
                    {resent && <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">✓ Verification email sent — check your inbox.</div>}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-11 text-[15px] rounded-xl">
                  {loading ? 'Signing in...' : <><span>Sign In</span> <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-500">New to DailyFlow?</span></div>
                </div>

                <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">No company yet? <Link to="/signup" className="text-[#004E72] font-semibold hover:underline">Create Company — Free</Link></div>
              </form>

            <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500 shrink-0">
              By signing in you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy</a>.
            </div>

            <div className="hidden lg:flex mt-4 items-center justify-center gap-2 text-xs text-zinc-400 shrink-0">
              <Link to="/" className="hover:text-zinc-600 dark:hover:text-zinc-300">← Back to home</Link>
              <span>•</span>
              <span>Need help? support@DailyFlow.co</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
