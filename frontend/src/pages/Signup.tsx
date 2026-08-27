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
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-[#fcfbf9] dark:bg-stone-950 font-sans">
      {/* Left — Executive Branding + Stepper */}
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

          <div className="mt-8 max-w-[440px]">
            <div className="text-[11px] tracking-wider font-extrabold text-amber-500 uppercase">Setup in 60 Seconds</div>
            <h1 className="mt-3 text-[30px] xl:text-[34px] font-black tracking-tight leading-[1.02]">Create your<br/><span className="font-light italic text-amber-400">organization workspace</span></h1>
            <p className="mt-3 text-xs leading-relaxed text-stone-300">A private, secure home for your entire workforce. You’ll be the workspace administrator — invite your team when you’re ready.</p>
          </div>

          {/* Live workspace preview */}
          <div className="mt-6 max-w-[440px] shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xl text-stone-900 border border-stone-200">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-500" />
              <div className="flex items-center gap-3 pt-1">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${form.logoPreview ? '' : 'bg-amber-500 text-stone-950 font-black shadow-xs'}`}>
                  {form.logoPreview ? <img src={form.logoPreview} alt="logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-stone-950" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate leading-tight text-stone-900">{form.companyName || 'Your Organization'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${form.industry ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-stone-100 border border-stone-200 text-stone-500'}`}>{form.industry || 'Industry'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${form.companySize ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-stone-100 border border-stone-200 text-stone-500'}`}>{form.companySize || 'Size'}</span>
                  </div>
                </div>
                {form.companyName && <span className="h-6 px-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1 shrink-0"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready</span>}
              </div>
              {(form.firstName || form.email) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <div className="h-7 w-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">{(form.firstName[0]||'A')}{(form.lastName[0]||'A')}</div>
                  <span className="truncate font-semibold text-stone-900">{form.firstName} {form.lastName}</span>
                  <span className="text-stone-300">•</span>
                  <span className="truncate text-stone-500">{form.email || 'admin@company.com'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex-1 min-h-0 relative flex flex-col">
            <div className="relative">
              <div className="absolute left-[15px] top-[14px] h-[calc(100%-28px)] w-px bg-stone-700" />
              <div className="space-y-6 relative">
                {steps.map((s,i)=>{
                  const active = i===step
                  const done = i < step
                  return (
                    <div key={s.title} className="flex gap-4">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition ${active ? 'bg-amber-500 text-stone-950 shadow-md' : done ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-stone-400 border border-stone-700'}`}>
                        {done ? <Check className="h-4 w-4" /> : <span>{i+1}</span>}
                      </div>
                      <div className="pt-0.5">
                        <div className={`text-xs font-bold leading-none ${active ? 'text-white' : done ? 'text-stone-200' : 'text-stone-400'}`}>{s.title}</div>
                        <div className={`text-[11px] mt-1 ${active ? 'text-stone-300' : 'text-stone-500'}`}>{s.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-auto pt-8 pb-2 space-y-2.5 max-w-[420px]">
              {[
                'Free for up to 5 employees',
                'No credit card required',
                'Enterprise security from day one',
              ].map(t=>(
                <div key={t} className="flex items-center gap-3 text-xs font-semibold text-stone-300">
                  <span className="h-5 w-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-amber-400" /></span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 shrink-0 flex items-center justify-between text-xs text-stone-400 pt-5 border-t border-stone-800 font-medium">
            <span>© 2026 DailyFlow Technologies</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Secure</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-amber-500" /> Private</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right — Form Container */}
      <div className="flex-1 lg:w-[50%] lg:shrink-0 flex flex-col bg-white dark:bg-stone-900 lg:overflow-hidden">
        <div className="lg:hidden h-16 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between px-4 shrink-0">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-sm"><span className="h-7 w-7 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xs">DF</span> DailyFlow</Link>
          <Link to="/login" className="text-xs text-amber-700 font-bold">Sign In</Link>
        </div>

        {/* Side Panel Card — flush, no outer gap/border */}
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-stone-900 overflow-hidden">
          {/* header */}
          <div className="px-6 sm:px-10 py-6 border-b border-stone-100 dark:border-stone-800 shrink-0">
            <div className="w-full max-w-2xl">
              <div className="hidden lg:flex items-center gap-2 text-xs">
                {steps.map((s,i)=>(
                  <div key={s.title} className="flex items-center gap-2">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border ${i===step ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs' : i<step ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}>{i<step ? <Check className="h-3 w-3" /> : i+1}</span>
                    <span className={`text-xs ${i===step ? 'font-bold text-stone-900 dark:text-white' : 'text-stone-500 font-medium'}`}>{s.title}</span>
                    {i<2 && <span className="ml-2 mr-1 text-stone-300">—</span>}
                  </div>
                ))}
              </div>
              <div className="lg:hidden flex items-center gap-1.5 mb-3">
                {steps.map((_,i)=>(
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i<=step ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'}`} />
                ))}
              </div>
              <h2 className="mt-4 text-xl font-black tracking-tight text-stone-900 dark:text-white leading-snug">
                {step===0 && 'Tell us about your organization'}
                {step===1 && 'Who is the workspace administrator?'}
                {step===2 && 'Secure your organization workspace'}
              </h2>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                {step===0 && 'This initializes your isolated multi-tenant workspace.'}
                {step===1 && 'The administrator who will manage onboarding and settings.'}
                {step===2 && 'Set an encrypted password — credentials can be updated anytime.'}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="flex-1 min-h-0 lg:overflow-y-auto px-6 sm:px-10 py-6 space-y-6">
           <div className="w-full max-w-2xl space-y-4">
            {step===0 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Organization Name <span className="text-rose-500">*</span></label>
                  <Input placeholder="Acme Technologies Pvt. Ltd." value={form.companyName} onChange={e=>update('companyName',e.target.value)} className="h-10 text-xs font-medium" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Industry</label>
                    <select value={form.industry} onChange={e=>update('industry',e.target.value)} className="flex h-10 w-full rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 px-3 text-xs font-medium focus:ring-2 focus:ring-amber-500">
                      <option value="">Select industry</option>
                      {industries.map(i=> <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Headcount Size</label>
                    <select value={form.companySize} onChange={e=>update('companySize',e.target.value)} className="flex h-10 w-full rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 px-3 text-xs font-medium focus:ring-2 focus:ring-amber-500">
                      <option value="">Select size</option>
                      {sizes.map(s=> <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Company Website (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input placeholder="https://example.com" value={form.website} onChange={e=>update('website',e.target.value)} className="h-10 pl-9 text-xs font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Company Logo <span className="text-[11px] font-normal text-stone-400">(optional)</span></label>
                  <div className={`border border-dashed rounded-2xl p-3.5 flex items-center gap-4 ${form.logoPreview ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20' : 'border-stone-200 dark:border-stone-700'}`}>
                    <div className="h-14 w-14 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                      {form.logoPreview ? <img src={form.logoPreview} alt="preview" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-stone-400" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-bold truncate">{form.logo ? form.logo.name : 'Upload company branding'}</div>
                      <div className="text-[11px] text-stone-500 leading-tight mt-0.5">PNG or JPG, up to 5MB</div>
                      <div className="mt-2 flex gap-2">
                        <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold cursor-pointer hover:bg-amber-600 shadow-2xs transition">
                          <Upload className="h-3 w-3" /> {form.logo ? 'Change' : 'Choose file'}
                          <input type="file" accept="image/*" className="hidden" onChange={e=>handleLogo(e.target.files?.[0]||null)} />
                        </label>
                        {form.logo && <button type="button" onClick={()=>handleLogo(null)} className="h-8 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium flex items-center gap-1 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"><X className="h-3 w-3" /> Remove</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step===1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">First Name <span className="text-rose-500">*</span></label>
                    <Input placeholder="Aarav" value={form.firstName} onChange={e=>update('firstName',e.target.value)} className="h-10 text-xs font-medium" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Last Name <span className="text-rose-500">*</span></label>
                    <Input placeholder="Sharma" value={form.lastName} onChange={e=>update('lastName',e.target.value)} className="h-10 text-xs font-medium" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Work Email <span className="text-rose-500">*</span></label>
                  <Input placeholder="admin@company.com" type="email" value={form.email} onChange={e=>update('email',e.target.value)} className="h-10 text-xs font-medium" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Phone</label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={e=>update('phone',e.target.value)} className="h-10 text-xs font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Job Title</label>
                    <Input value={form.jobTitle} onChange={e=>update('jobTitle',e.target.value)} className="h-10 text-xs font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Department</label>
                    <Input placeholder="Administration" value={form.department} onChange={e=>update('department',e.target.value)} className="h-10 text-xs font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Office Location</label>
                    <Input placeholder="Bengaluru, India" value={form.address} onChange={e=>update('address',e.target.value)} className="h-10 text-xs font-medium" />
                  </div>
                </div>
                <div className="border-t border-stone-200 dark:border-stone-800 pt-4 flex gap-3 items-center">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0">{(form.firstName[0]||'A')}{(form.lastName[0]||'A')}</div>
                  <div className="text-xs min-w-0">
                    <div className="font-bold text-stone-900 dark:text-white truncate">{form.firstName||'First'} {form.lastName||'Last'}</div>
                    <div className="text-[11px] text-stone-500 truncate font-medium">{form.email||'email@company.com'} • {form.phone||'phone'}</div>
                  </div>
                </div>
              </div>
            )}

            {step===2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Input type={showPw ? 'text':'password'} placeholder="8+ chars, upper/lower/number/special" value={form.password} onChange={e=>update('password',e.target.value)} className="h-10 pr-10 text-xs font-medium" required />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 cursor-pointer">{showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    {[0,1,2,3,4].map(i=> <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < pwScore ? (pwScore===5 ? 'bg-emerald-500' : pwScore>=3 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-stone-200 dark:bg-stone-700'}`} />)}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1">
                    {[
                      ['len','8+ chars'],
                      ['upper','Uppercase'],
                      ['lower','Lowercase'],
                      ['num','Number'],
                      ['special','Special char'],
                    ].map(([k,label])=>(
                      <li key={k} className={`flex items-center gap-1.5 font-medium ${ (passwordChecks as any)[k] ? 'text-emerald-600' : 'text-stone-400'}`}>
                        <Check className={`h-3 w-3 shrink-0 ${ (passwordChecks as any)[k] ? 'opacity-100' : 'opacity-30'}`} /> {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Confirm Password <span className="text-rose-500">*</span></label>
                  <Input type={showPw ? 'text':'password'} value={form.confirm} onChange={e=>update('confirm',e.target.value)} className="h-10 text-xs font-medium" required />
                  {form.confirm && form.password!==form.confirm && <p className="text-xs text-rose-600 font-semibold">Passwords do not match</p>}
                  {form.confirm && form.password===form.confirm && form.password && <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Match</p>}
                </div>

                <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-1.5">
                  <div className="text-xs font-bold flex items-center gap-1.5 text-stone-900 dark:text-white"><Users className="h-4 w-4 text-amber-600" /> Review Workspace Summary</div>
                  <div className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 space-y-0.5">
                    <div><span className="font-semibold text-stone-900 dark:text-white">Organization:</span> {form.companyName || '—'} {form.industry && `• ${form.industry}`} {form.companySize && `• ${form.companySize}`}</div>
                    <div><span className="font-semibold text-stone-900 dark:text-white">Administrator:</span> {form.firstName} {form.lastName} • {form.email}</div>
                  </div>
                </div>

                <label className="flex gap-2.5 py-2 border-t border-stone-200 dark:border-stone-700 cursor-pointer items-start">
                  <input type="checkbox" checked={form.agree} onChange={e=>update('agree',e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500 shrink-0" />
                  <span className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 font-medium">I agree to <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline text-amber-700 dark:text-amber-400 font-bold">Terms</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-amber-700 dark:text-amber-400 font-bold">Privacy Policy</Link> and confirm I am authorized to register this organization.</span>
                </label>
              </div>
            )}

            {err && <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-3 font-medium">{err}</div>}

            <div className="flex gap-2.5 pt-2">
              {step>0 && <Button type="button" variant="outline" onClick={back} className="h-10 px-5 text-xs font-bold rounded-2xl"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>}
              {step<2 ? (
                <Button type="button" onClick={next} className="flex-1 h-10 text-xs font-bold rounded-2xl">Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              ) : (
                <Button type="submit" disabled={loading || !canStep2} className="flex-1 h-10 text-xs font-bold rounded-2xl">{loading?'Creating...':'Create Workspace & Sign In'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100 dark:border-stone-800 font-medium">
              <span>Step {step+1} of 3</span>
              <span className="flex items-center gap-1">{step===0 && !canStep0 && 'Organization name required'} {step===1 && !canStep1 && 'Admin details incomplete'} {step===2 && !canStep2 && 'Complete password & terms'} {((step===0&&canStep0)||(step===1&&canStep1)||(step===2&&canStep2)) && <span className="text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>}</span>
            </div>
           </div>
          </form>

          <div className="px-6 sm:px-10 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-3 text-xs text-stone-600 dark:text-stone-400 shrink-0 font-medium">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-8 px-4 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-600 transition shadow-2xs"
            >
              Sign In
            </Link>
            <span className="text-stone-300">•</span>
            <Link to="/" className="hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

