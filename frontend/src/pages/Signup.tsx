import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { api } from '../api/client'
import {
  ArrowRight, ArrowLeft, Upload, Building2, Check, ShieldCheck, Globe, Users, Eye, EyeOff, Image as ImageIcon, X, Lock
} from 'lucide-react'
import StafloLogo, { StafloIcon } from '../components/Logo'

type Form = {
  companyName: string
  industry: string
  companySize: string
  website: string
  logo: File | null
  logoPreview: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  department: string
  address: string
  password: string
  confirm: string
  agree: boolean
}

const industries = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Consulting','Hospitality','Construction','Other']
const sizes = ['1-5','6-20','21-50','51-200','201-500','500+']

export default function Signup(){
  const [step,setStep]=useState(0)
  const [form,setForm]=useState<Form>({
    companyName:'', industry:'', companySize:'', website:'', logo:null, logoPreview:null,
    firstName:'', lastName:'', email:'', phone:'', jobTitle:'Administrator', department:'Administration', address:'',
    password:'', confirm:'', agree:false
  })
  const [showPw,setShowPw]=useState(false)
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const { signupCompany } = useAuth()
  const nav = useNavigate()
  const update=(k:string,v:any)=> setForm(s=>({...s,[k]:v}))

  const passwordChecks = useMemo(()=>{
    const p=form.password
    return {
      len: p.length>=8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      num: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    }
  },[form.password])
  const pwScore = Object.values(passwordChecks).filter(Boolean).length
  const canStep0 = form.companyName.trim().length>=2
  const canStep1 = form.firstName.trim() && form.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const canStep2 = pwScore===5 && form.password===form.confirm && form.agree

  const handleLogo = (f: File | null)=>{
    if(!f){ update('logo',null); update('logoPreview',null); return }
    update('logo',f)
    const url = URL.createObjectURL(f)
    update('logoPreview',url)
  }

  const next = ()=>{
    setErr('')
    if(step===0 && !canStep0) return setErr('Company name must be at least 2 characters.')
    if(step===1 && !canStep1) return setErr('Please provide a valid first name, last name, and work email.')
    setStep(s=>Math.min(2, s+1))
  }
  const back = ()=> { setErr(''); setStep(s=>Math.max(0, s-1)) }

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!canStep2) return
    setErr('')
    setLoading(true)
    try{
      await signupCompany({
        companyName: form.companyName.trim(),
        name: form.companyName.trim(),
        adminFirstName: form.firstName.trim(),
        first_name: form.firstName.trim(),
        adminLastName: form.lastName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
        website: form.website.trim() || undefined,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        address: form.address.trim() || undefined,
        agreeTerms: form.agree
      })
      if(form.logo){
        const fd = new FormData()
        fd.append('file', form.logo)
        try{ await api.post('/companies/logo', fd)} catch(e){ console.warn('logo upload failed', e)}
      }
      nav('/dashboard')
    }catch(ex:any){
      const detail = ex.response?.data?.detail
      if (Array.isArray(detail)) {
        setErr(detail.map((d:any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setErr(detail)
      } else {
        setErr(ex.response?.data?.message || ex.message || 'Signup failed — please check your information and try again.')
      }
    }finally{ setLoading(false)}
  }

  const steps = [
    {title:'Company', desc:'Your workspace'},
    {title:'Administrator', desc:'Your leadership profile'},
    {title:'Security', desc:'Protect access'},
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-zinc-950">
      {/* Left — Executive Branding & Workspace Preview */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative bg-[#092634] text-white flex-col shrink-0 p-8 xl:p-12 justify-between overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004E72]/40 via-[#092634] to-[#092634] pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-[480px] w-[480px] rounded-full bg-[#004E72]/20 blur-[90px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <Link to="/" className="inline-flex items-center gap-1.5">
            <StafloIcon size={34} />
            <span className="font-logo text-2xl text-white">staflo</span>
          </Link>

          <div>
            <div className="text-[11px] tracking-[0.16em] font-semibold text-white/60 uppercase">Setup in 60 seconds</div>
            <h1 className="mt-2 text-2xl xl:text-3xl font-bold tracking-tight leading-tight">
              Create your<br />
              <span className="font-light italic text-white/80">company workspace</span>
            </h1>
            <p className="mt-2 text-xs xl:text-sm leading-relaxed text-white/70">
              A private, secure home for your entire workforce. You'll be the owner — invite your team when you're ready.
            </p>
          </div>

          {/* Live workspace preview */}
          <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur p-4 shadow-xl text-zinc-900 border border-white/20">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${form.logoPreview ? '' : 'bg-gradient-to-br from-[#004E72] to-[#092634]'}`}>
                {form.logoPreview ? <img src={form.logoPreview} alt="logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-white/90" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{form.companyName || 'Your Company'}</div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.industry ? 'bg-[#004E72]/10 text-[#004E72]' : 'bg-zinc-100 text-zinc-400'}`}>{form.industry || 'Industry'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.companySize ? 'bg-sky-50 text-sky-700' : 'bg-zinc-100 text-zinc-400'}`}>{form.companySize || 'Size'}</span>
                </div>
              </div>
              {form.companyName && <span className="h-6 px-2 rounded-full bg-green-50 text-green-700 text-[10px] font-medium flex items-center gap-1 shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Ready</span>}
            </div>
            {(form.firstName || form.email) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5">
                <div className="h-6 w-6 rounded-full bg-[#004E72] text-white flex items-center justify-center font-bold text-[10px] shrink-0">{(form.firstName[0]||'A')}{(form.lastName[0]||'A')}</div>
                <span className="truncate font-medium">{form.firstName} {form.lastName}</span>
                <span className="text-zinc-300">•</span>
                <span className="truncate text-zinc-500">{form.email || 'admin@company.com'}</span>
              </div>
            )}
          </div>

          {/* Stepper on left */}
          <div className="space-y-4 pt-2">
            {steps.map((s,i)=>{
              const active = i===step
              const done = i < step
              return (
                <div key={s.title} className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border text-xs transition ${active ? 'bg-white text-[#092634] font-bold border-white shadow' : done ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent text-white/50 border-white/20'}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : i+1}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${active ? 'text-white' : done ? 'text-white/80' : 'text-white/50'}`}>{s.title}</div>
                    <div className={`text-[11px] ${active ? 'text-white/70' : 'text-white/40'}`}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <span>© 2026 staflo Technologies</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
          </span>
        </div>
      </div>

      {/* Right — Form Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto">
        {/* Mobile top header */}
        <div className="lg:hidden h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <StafloIcon size={26} />
            <span className="font-logo text-xl">staflo</span>
          </Link>
          <Link to="/login" className="text-xs text-[#004E72] font-medium">Sign In</Link>
        </div>

        {/* Step Progress Top Bar */}
        <div className="px-6 sm:px-12 pt-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="max-w-xl mx-auto flex items-center gap-3 text-xs">
            {steps.map((s,i)=>(
              <div key={s.title} className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${i===step ? 'bg-[#004E72] text-white border-[#004E72]' : i<step ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>{i<step ? <Check className="h-3 w-3" /> : i+1}</span>
                <span className={`text-xs ${i===step ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{s.title}</span>
                {i<2 && <span className="ml-2 text-zinc-300 dark:text-zinc-700">—</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 px-6 sm:px-12 py-8 max-w-xl w-full mx-auto flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {step===0 && 'Tell us about your company'}
              {step===1 && 'Create administrator profile'}
              {step===2 && 'Secure your workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {step===0 && 'This creates your organization workspace on Staflo.'}
              {step===1 && 'You will be the primary administrator with full access.'}
              {step===2 && 'Set a strong password — you can update it anytime.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Step 0: Company */}
            {step===0 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Acme Technologies Inc." value={form.companyName} onChange={e=>update('companyName',e.target.value)} required autoFocus className="h-10 text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Industry</label>
                    <select value={form.industry} onChange={e=>update('industry',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm">
                      <option value="">Select industry</option>
                      {industries.map(i=> <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Size</label>
                    <select value={form.companySize} onChange={e=>update('companySize',e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm">
                      <option value="">Select size</option>
                      {sizes.map(s=> <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Website (optional)</label>
                  <Input placeholder="https://acme.com" value={form.website} onChange={e=>update('website',e.target.value)} className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Logo (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium hover:bg-zinc-100 transition">
                      <Upload className="h-3.5 w-3.5" /> Choose Logo
                      <input type="file" accept="image/*" onChange={e=>handleLogo(e.target.files?.[0]||null)} className="hidden" />
                    </label>
                    {form.logo && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">{form.logo.name}</span>
                        <button type="button" onClick={()=>handleLogo(null)}><X className="h-3 w-3 text-red-500"/></button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Administrator */}
            {step===1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">First Name <span className="text-red-500">*</span></label>
                    <Input placeholder="John" value={form.firstName} onChange={e=>update('firstName',e.target.value)} required autoFocus className="h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Last Name <span className="text-red-500">*</span></label>
                    <Input placeholder="Doe" value={form.lastName} onChange={e=>update('lastName',e.target.value)} required className="h-10 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Work Email <span className="text-red-500">*</span></label>
                  <Input type="email" placeholder="john@acme.com" value={form.email} onChange={e=>update('email',e.target.value)} required className="h-10 text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phone</label>
                    <Input placeholder="+91 9876543210" value={form.phone} onChange={e=>update('phone',e.target.value)} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Job Title</label>
                    <Input placeholder="HR Director / Founder" value={form.jobTitle} onChange={e=>update('jobTitle',e.target.value)} className="h-10 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Security & Review */}
            {step===2 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text':'password'}
                      placeholder="Enter a strong password"
                      value={form.password}
                      onChange={e=>update('password',e.target.value)}
                      required
                      autoFocus
                      className="h-10 pr-10 text-sm"
                    />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-zinc-500">
                      {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  <div className="flex gap-1.5 pt-1.5">
                    {[0,1,2,3,4].map(i=> <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < pwScore ? (pwScore===5 ? 'bg-emerald-500' : pwScore>=3 ? 'bg-amber-500' : 'bg-red-500') : 'bg-zinc-200 dark:bg-zinc-800'}`} />)}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1">
                    {[
                      ['len','8+ characters'],
                      ['upper','Uppercase letter'],
                      ['lower','Lowercase letter'],
                      ['num','Number'],
                      ['special','Special character'],
                    ].map(([k,label])=>(
                      <li key={k} className={`flex items-center gap-1.5 ${(passwordChecks as any)[k] ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400'}`}>
                        <Check className="h-3 w-3" /> {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirm Password <span className="text-red-500">*</span></label>
                  <Input
                    type={showPw ? 'text':'password'}
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={e=>update('confirm',e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                  {form.confirm && form.password!==form.confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                  {form.confirm && form.password===form.confirm && form.password && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><Check className="h-3.5 w-3.5" /> Passwords match</p>}
                </div>

                {/* Review summary box */}
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#004E72]" /> Workspace Summary
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div><span className="font-medium text-zinc-900 dark:text-white">Company:</span> {form.companyName} {form.industry && `(${form.industry})`}</div>
                    <div><span className="font-medium text-zinc-900 dark:text-white">Owner:</span> {form.firstName} {form.lastName} • {form.email}</div>
                  </div>
                </div>

                <label className="flex gap-2.5 cursor-pointer items-start pt-1">
                  <input type="checkbox" checked={form.agree} onChange={e=>update('agree',e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#004E72] focus:ring-[#004E72] shrink-0" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    I agree to the <Link to="/terms" target="_blank" className="underline text-[#004E72]">Terms</Link> and <Link to="/privacy" target="_blank" className="underline text-[#004E72]">Privacy Policy</Link> and confirm I am authorized to create this workspace.
                  </span>
                </label>
              </div>
            )}

            {err && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                {err}
              </div>
            )}

            {/* Navigation & Submit Buttons */}
            <div className="flex items-center gap-3 pt-3">
              {step>0 && (
                <Button type="button" variant="outline" onClick={back} className="h-10 px-4 text-xs font-medium">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                </Button>
              )}
              {step<2 ? (
                <Button type="button" onClick={next} className="flex-1 h-10 text-xs font-medium">
                  Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading || !canStep2} className="flex-1 h-10 text-xs font-medium">
                  {loading ? 'Creating Workspace…' : 'Create Company Workspace'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
              Already have an account? <Link to="/login" className="font-semibold text-[#004E72] hover:underline">Sign In</Link> • <Link to="/" className="hover:underline">Back to home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
