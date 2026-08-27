import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { api } from '../api/client'
import {
  ArrowRight, ArrowLeft, Upload, Building2, Check, ShieldCheck, Globe, Users, Eye, EyeOff, Image as ImageIcon, X, Lock
} from 'lucide-react'

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
    if(step===0 && !canStep0) return setErr('Company name is required (min 2 characters).')
    if(step===1 && !canStep1) return setErr('Please provide first name, last name and a valid work email.')
    setStep(s=> Math.min(s+1,2))
  }
  const back = ()=> { setErr(''); setStep(s=> Math.max(s-1,0)) }

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); setErr('')
    if(!canStep0) { setStep(0); return setErr('Complete company details.') }
    if(!canStep1) { setStep(1); return setErr('Complete administrator profile.') }
    if(!canStep2) return setErr('Fix password requirements, confirm it, and accept Terms.')
    setLoading(true)
    try{
      await signupCompany({
        companyName: form.companyName.trim(),
        adminFirstName: form.firstName.trim(),
        adminLastName: form.lastName.trim(),
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
    }catch(ex:any){ setErr(ex.response?.data?.detail || 'Signup failed — try a different email or company name.')}
    finally{ setLoading(false)}
  }

  const steps = [
    {title:'Company', desc:'Your workspace'},
    {title:'Administrator', desc:'Your leadership profile'},
    {title:'Security', desc:'Protect access'},
  ]

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-white dark:bg-zinc-950">
      {/* Left — Executive Branding + Stepper */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#1c1917] text-white flex-col shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] via-[#092634] to-[#004E72]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 h-[560px] w-[560px] rounded-full bg-white/[0.06] blur-[90px]" />
        <div className="absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-[#092634]/20 blur-[80px]" />
        {/* subtle grid texture — matches landing CTA */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px] opacity-30" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.svg" alt="DailyFlow logo" className="h-9 w-9 rounded-xl" />
            <span className="font-bold text-xl tracking-tight">DailyFlow</span>
          </Link>

          <div className="mt-8 max-w-[440px]">
            <div className="text-[11px] tracking-[0.16em] font-semibold text-white/60">SETUP IN 60 SECONDS</div>
            <h1 className="mt-3 text-[30px] xl:text-[34px] font-bold tracking-tight leading-[0.95]">Create your<br/><span className="font-light italic text-white/80">company workspace</span></h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">A private, secure home for your entire workforce. You’ll be the owner — invite your team when you’re ready.</p>
          </div>

          {/* Live workspace preview */}
          <div className="mt-6 max-w-[440px] shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/30 text-zinc-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#004E72] via-[#fcd34d] to-[#e0b64c]" />
              <div className="flex items-center gap-3 pt-1">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${form.logoPreview ? '' : 'bg-gradient-to-br from-[#004E72] to-[#451a03] shadow-inner'}`}>
                  {form.logoPreview ? <img src={form.logoPreview} alt="logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-white/90" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate leading-tight">{form.companyName || 'Your Company'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.industry ? 'bg-[#004E72]/10 border border-[#004E72]/25 text-[#004E72]' : 'bg-zinc-100 border border-zinc-200 text-zinc-400'}`}>{form.industry || 'Industry'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.companySize ? 'bg-sky-50 border border-sky-200 text-sky-700' : 'bg-zinc-100 border border-zinc-200 text-zinc-400'}`}>{form.companySize || 'Size'}</span>
                  </div>
                </div>
                {form.companyName && <span className="h-6 px-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium flex items-center gap-1 shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Ready</span>}
              </div>
              {(form.firstName || form.email) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#004E72] to-[#451a03] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">{(form.firstName[0]||'A')}{(form.lastName[0]||'A')}</div>
                  <span className="truncate font-medium">{form.firstName} {form.lastName}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="truncate text-zinc-500">{form.email || 'admin@company.com'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex-1 min-h-0 relative flex flex-col">
            <div className="relative">
              <div className="absolute left-[15px] top-[14px] h-[calc(100%-28px)] w-px bg-white/15" />
              <div className="space-y-6 relative">
                {steps.map((s,i)=>{
                  const active = i===step
                  const done = i < step
                  return (
                    <div key={s.title} className="flex gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 transition ${active ? 'bg-white text-[#451a03] border-white shadow-lg' : done ? 'bg-white text-[#451a03] border-white' : 'bg-transparent text-white/60 border-white/25'}`}>
                        {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i+1}</span>}
                      </div>
                      <div className="pt-0.5">
                        <div className={`text-sm font-semibold leading-none ${active ? 'text-white' : done ? 'text-white/80' : 'text-white/60'}`}>{s.title}</div>
                        <div className={`text-xs mt-1 ${active ? 'text-white/70' : 'text-white/45'}`}>{s.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Benefits — landing style checklist */}
            <div className="mt-auto pt-10 pb-2 space-y-3 max-w-[420px]">
              {[
                'Free for up to 5 employees',
                'No credit card required',
                'Enterprise security from day one',
              ].map(t=>(
                <div key={t} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="h-6 w-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Check className="h-3.5 w-3.5" /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 shrink-0 flex items-center justify-between text-xs text-white/50 pt-5 border-t border-white/10">
            <span>© 2026 DailyFlow Technologies</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right — 50% Side Panel Card - no outer space */}
        <div className="flex-1 lg:w-[48%] lg:shrink-0 flex flex-col bg-white dark:bg-zinc-900 lg:bg-white lg:dark:bg-zinc-900 lg:overflow-hidden">
        <div className="lg:hidden h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0">
          <Link to="/" className="flex items-center gap-2 font-bold text-sm"><img src="/logo.svg" alt="DailyFlow logo" className="h-6 w-6 rounded-lg" /> DailyFlow</Link>
          <Link to="/login" className="text-xs text-[#004E72] font-medium">Sign In</Link>
        </div>

        {/* Side Panel Card — flush, no outer gap/border */}
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* header */}
          <div className="px-6 sm:px-10 py-7 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="w-full max-w-2xl">
              <div className="hidden lg:flex items-center gap-2 text-xs">
                {steps.map((s,i)=>(
                  <div key={s.title} className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${i===step ? 'bg-[#004E72] text-white border-[#004E72]' : i<step ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}>{i<step ? <Check className="h-3 w-3" /> : i+1}</span>
                    <span className={`text-sm ${i===step ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{s.title}</span>
                    {i<2 && <span className="ml-2 mr-1 text-zinc-300">—</span>}
                  </div>
                ))}
              </div>
              <div className="lg:hidden flex items-center gap-1.5 mb-3">
                {steps.map((_,i)=>(
                  <div key={i} className={`h-1 flex-1 rounded-full ${i<=step ? 'bg-[#004E72]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                ))}
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-snug">
                {step===0 && 'Tell us about your company'}
                {step===1 && 'Who is the administrator?'}
                {step===2 && 'Secure your workspace'}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step===0 && 'This creates your private workspace.'}
                {step===1 && 'The owner who will invite your team.'}
                {step===2 && 'Set a strong password — you can update it anytime.'}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="flex-1 min-h-0 lg:overflow-y-auto px-6 sm:px-10 py-7 space-y-6">
           <div className="w-full max-w-2xl space-y-5">
            {step===0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Company Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Olive Systems Pvt. Ltd." value={form.companyName} onChange={e=>update('companyName',e.target.value)} className="h-10 text-sm" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Industry</label>
                    <select value={form.industry} onChange={e=>update('industry',e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 px-3 text-sm">
                      <option value="">Select industry</option>
                      {industries.map(i=> <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Company Size</label>
                    <select value={form.companySize} onChange={e=>update('companySize',e.target.value)} className="flex h-10 w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 px-3 text-sm">
                      <option value="">Select size</option>
                      {sizes.map(s=> <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Website (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input placeholder="https://example.com" value={form.website} onChange={e=>update('website',e.target.value)} className="h-10 pl-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Company Logo <span className="text-xs font-normal text-zinc-500">(optional)</span></label>
                  <div className={`border border-dashed rounded-lg p-3.5 flex items-center gap-4 ${form.logoPreview ? 'border-[#004E72]/30 bg-[#004E72]/5' : 'border-zinc-200 dark:border-zinc-700'}`}>
                    <div className="h-14 w-14 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                      {form.logoPreview ? <img src={form.logoPreview} alt="preview" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-zinc-400" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">{form.logo ? form.logo.name : 'Upload logo'}</div>
                      <div className="text-xs text-zinc-500 leading-tight mt-0.5">PNG or JPG, up to 5MB</div>
                      <div className="mt-2 flex gap-2">
                        <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#004E72] text-white text-xs font-medium cursor-pointer hover:bg-[#5d3d55] transition-colors">
                          <Upload className="h-3 w-3" /> {form.logo ? 'Change' : 'Choose file'}
                          <input type="file" accept="image/*" className="hidden" onChange={e=>handleLogo(e.target.files?.[0]||null)} />
                        </label>
                        {form.logo && <button type="button" onClick={()=>handleLogo(null)} className="h-8 px-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs flex items-center gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-800"><X className="h-3 w-3" /> Remove</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step===1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">First Name <span className="text-red-500">*</span></label>
                    <Input placeholder="Aarav" value={form.firstName} onChange={e=>update('firstName',e.target.value)} className="h-10 text-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Last Name <span className="text-red-500">*</span></label>
                    <Input placeholder="Sharma" value={form.lastName} onChange={e=>update('lastName',e.target.value)} className="h-10 text-sm" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Work Email <span className="text-red-500">*</span></label>
                  <Input placeholder="admin@olivesys.com" type="email" value={form.email} onChange={e=>update('email',e.target.value)} className="h-10 text-sm" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Phone</label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={e=>update('phone',e.target.value)} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Job Title</label>
                    <Input value={form.jobTitle} onChange={e=>update('jobTitle',e.target.value)} className="h-10 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Department</label>
                    <Input placeholder="Administration" value={form.department} onChange={e=>update('department',e.target.value)} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium">Address (optional)</label>
                    <Input placeholder="Bengaluru, Karnataka" value={form.address} onChange={e=>update('address',e.target.value)} className="h-10 text-sm" />
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex gap-3 items-center">
                  <div className="h-9 w-9 rounded-full bg-[#004E72] text-white flex items-center justify-center font-bold text-xs shrink-0">{(form.firstName[0]||'A')}{(form.lastName[0]||'A')}</div>
                  <div className="text-xs min-w-0">
                    <div className="font-medium truncate">{form.firstName||'First'} {form.lastName||'Last'}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{form.email||'email@company.com'} • {form.phone||'phone'}</div>
                  </div>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Input type={showPw ? 'text':'password'} placeholder="8+ chars, upper/lower/number/special" value={form.password} onChange={e=>update('password',e.target.value)} className="h-10 pr-10 text-sm" required />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500">{showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    {[0,1,2,3,4].map(i=> <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < pwScore ? (pwScore===5 ? 'bg-green-500' : pwScore>=3 ? 'bg-amber-500' : 'bg-red-500') : 'bg-zinc-200 dark:bg-zinc-700'}`} />)}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2">
                    {[
                      ['len','8+ chars'],
                      ['upper','Uppercase'],
                      ['lower','Lowercase'],
                      ['num','Number'],
                      ['special','Special'],
                    ].map(([k,label])=>(
                      <li key={k} className={`flex items-center gap-1.5 ${ (passwordChecks as any)[k] ? 'text-green-600' : 'text-zinc-500'}`}>
                        <Check className={`h-3 w-3 shrink-0 ${ (passwordChecks as any)[k] ? 'opacity-100' : 'opacity-30'}`} /> {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium">Confirm Password <span className="text-red-500">*</span></label>
                  <Input type={showPw ? 'text':'password'} value={form.confirm} onChange={e=>update('confirm',e.target.value)} className="h-10 text-sm" required />
                  {form.confirm && form.password!==form.confirm && <p className="text-xs text-red-600">Passwords do not match</p>}
                  {form.confirm && form.password===form.confirm && form.password && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Match</p>}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4 w-4 text-[#004E72]" /> Review</div>
                  <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-1">
                    <div><span className="font-medium text-zinc-900 dark:text-white">Company:</span> {form.companyName || '—'} {form.industry && `• ${form.industry}`} {form.companySize && `• ${form.companySize}`}</div>
                    <div><span className="font-medium text-zinc-900 dark:text-white">Admin:</span> {form.firstName} {form.lastName} • {form.email}</div>
                  </div>
                </div>

                <label className="flex gap-3 py-3 border-t border-zinc-200 dark:border-zinc-700 cursor-pointer items-start">
                  <input type="checkbox" checked={form.agree} onChange={e=>update('agree',e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#004E72] focus:ring-[#004E72] shrink-0" />
                  <span className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">I agree to <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline text-[#004E72]">Terms</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-[#004E72]">Privacy</Link> and confirm I am authorized to create this workspace.</span>
                </label>
              </div>
            )}

            {err && <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3 leading-relaxed">{err}</div>}

            <div className="flex gap-2.5 pt-2">
              {step>0 && <Button type="button" variant="outline" onClick={back} className="h-10 px-5 text-sm"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>}
              {step<2 ? (
                <Button type="button" onClick={next} className="flex-1 h-10 text-sm">Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              ) : (
                <Button type="submit" disabled={loading || !canStep2} className="flex-1 h-10 text-sm">{loading?'Creating...':'Create Company & Sign In'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span>Step {step+1} of 3</span>
              <span className="flex items-center gap-1">{step===0 && !canStep0 && 'Company name required'} {step===1 && !canStep1 && 'Admin details incomplete'} {step===2 && !canStep2 && 'Complete password & terms'} {((step===0&&canStep0)||(step===1&&canStep1)||(step===2&&canStep2)) && <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>}</span>
            </div>
           </div>
          </form>

          <div className="px-6 sm:px-10 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 shrink-0">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-[#004E72] text-white text-xs font-semibold hover:bg-[#FF6E42] transition-colors shadow"
            >
              Sign In
            </Link>
            <span className="text-zinc-300">•</span>
            <Link to="/" className="hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
