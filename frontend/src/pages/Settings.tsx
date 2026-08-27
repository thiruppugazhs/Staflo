import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { openRazorpayCheckout } from '../lib/razorpay'
import { useThemeStore, THEME_PALETTES } from '../stores/theme'
import { Palette, Sun, Moon, Check, KeyRound } from 'lucide-react'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

export default function Settings(){
  const { user } = useAuth()
  const { themeId, isDark, setTheme, toggleDark } = useThemeStore()
  const isAdmin = user?.role==='admin' || user?.role==='hr'
  const [company,setCompany]=useState<any>(null)
  const [name,setName]=useState('')
  const [msg,setMsg]=useState('')
  const [logoFile,setLogoFile]=useState<File|null>(null)
  const [logoPreview,setLogoPreview]=useState<string|null>(null)
  const [uploading,setUploading]=useState(false)

  // Password OTP state
  const [pwd,setPwd]=useState({old:'', next:'', confirm:''})
  const [pwdOtpSent, setPwdOtpSent] = useState(false)
  const [pwdOtp, setPwdOtp] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const load = async()=>{
    try{ const {data}=await api.get('/companies/me'); setCompany(data); setName(data.name)}catch(e:any){ setMsg(e.response?.data?.detail||'load failed')}
  }
  useEffect(()=>{ load() },[])

  const saveName = async()=>{
    setMsg('')
    try{ const {data}=await api.patch('/companies/me', {name}); setCompany(data); setMsg('Company name updated')} catch(e:any){ setMsg(e.response?.data?.detail||'failed')}
  }
  const handleFileChange = (f: File | null)=>{
    setLogoFile(f)
    if(f){
      if(f.size > 2*1024*1024){ setMsg('Logo must be <2MB'); setLogoFile(null); setLogoPreview(null); return }
      if(!f.type.startsWith('image/')){ setMsg('Only image files allowed'); setLogoFile(null); setLogoPreview(null); return }
      setLogoPreview(URL.createObjectURL(f)); setMsg('')
    } else { setLogoPreview(null)}
  }
  const uploadLogo = async()=>{
    if(!logoFile) return setMsg('Pick an image file first — click Choose File')
    setUploading(true); setMsg('')
    const fd=new FormData(); fd.append('file', logoFile)
    try{
      const {data}=await api.post('/companies/logo', fd)
      setCompany((c:any)=> ({...c, logo_url:data.logo_url}))
      setMsg('Logo uploaded ✓')
      setLogoFile(null); setLogoPreview(null)
      const el = document.getElementById('logo-input') as HTMLInputElement | null
      if(el) el.value=''
    } catch(e:any){
      const detail = e.response?.data?.detail
      if(Array.isArray(detail)) setMsg(detail.map((d:any)=> d.msg || JSON.stringify(d)).join(', '))
      else if(typeof detail==='string') setMsg(detail)
      else setMsg(e.response?.data?.message || e.message || 'upload failed')
    } finally{ setUploading(false) }
  }

  const requestPasswordOtp = async()=>{
    setPwdLoading(true)
    setMsg('')
    try{
      const { data } = await api.post('/auth/change-password-otp')
      setPwdOtpSent(true)
      setMsg(data.message || '6-digit verification OTP sent to your email!')
    }catch(e:any){
      setMsg(e.response?.data?.detail || 'Failed to send OTP')
    }finally{
      setPwdLoading(false)
    }
  }

  const changePwdWithOtp = async()=>{
    if(!pwd.next || pwd.next.length < 6) return setMsg('Password must be at least 6 characters')
    if(pwd.next !== pwd.confirm) return setMsg('New passwords mismatch')
    if(!pwdOtp || pwdOtp.length !== 6) return setMsg('Please enter the 6-digit OTP code')
    setPwdLoading(true)
    setMsg('')
    try{
      const { data } = await api.post('/auth/change-password-with-otp', {
        old_password: pwd.old,
        new_password: pwd.next,
        otp_code: pwdOtp
      })
      setMsg(data.message || 'Password changed successfully!')
      setPwd({old:'', next:'', confirm:''})
      setPwdOtp('')
      setPwdOtpSent(false)
    }catch(e:any){
      setMsg(e.response?.data?.detail || 'Failed to update password')
    }finally{
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System & Workspace Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Theme customization, company details, billing & account security</p>
      </div>

      {/* Theme & Appearance Customizer */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#004E72]"/> Appearance & Color Themes
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Customize your portal interface styling across the whole application</p>
          </div>
          <button
            onClick={toggleDark}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400"/> : <Moon className="h-4 w-4 text-zinc-600"/>}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Choose Theme Palette</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_PALETTES.map(palette => {
              const active = themeId === palette.id
              return (
                <button
                  key={palette.id}
                  onClick={() => setTheme(palette.id)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between space-y-2 ${active ? 'border-[#004E72] ring-2 ring-[#004E72]/40 bg-sky-50/40 dark:bg-sky-950/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{palette.name}</span>
                    {active && <Check className="h-4 w-4 text-[#004E72]"/>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: palette.primary }} title={`Primary: ${palette.primary}`}/>
                    <span className="h-5 w-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: palette.secondary }} title={`Secondary: ${palette.secondary}`}/>
                    <span className="h-5 w-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: palette.accent }} title={`Accent: ${palette.accent}`}/>
                    <span className="h-5 w-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: palette.bg }} title={`Background: ${palette.bg}`}/>
                  </div>
                  <span className="text-[10px] text-zinc-500">{palette.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Company Details */}
      {company ? (
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base">Company Profile</h3>
          <div>
            <label className="text-xs font-semibold text-zinc-500">Company Name (slug: {company.slug})</label>
            <div className="flex gap-2 mt-1">
              <Input value={name} onChange={e=>setName(e.target.value)} disabled={!isAdmin} className="h-9 text-xs"/>
              <Button onClick={saveName} disabled={!isAdmin} className="h-9 text-xs bg-[#004E72] text-white">Save Name</Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">Company Logo</label>
            {company.logo_url && <img src={resolveFileUrl(company.logo_url)} alt="logo" className="h-14 mt-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 object-contain bg-white"/>}
            {logoPreview && <img src={logoPreview} alt="preview" className="h-14 mt-2 border border-[#004E72] rounded-lg p-1 object-contain bg-white"/>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input id="logo-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>handleFileChange(e.target.files?.[0]||null)} className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:text-white file:text-xs hover:file:bg-zinc-800 dark:file:bg-zinc-700" disabled={!isAdmin}/>
              <Button size="sm" variant="outline" onClick={uploadLogo} disabled={!isAdmin || !logoFile || uploading} className="h-8 text-xs">{uploading ? 'Uploading…' : 'Upload Logo'}</Button>
              {logoFile && <span className="text-xs text-zinc-600 truncate max-w-[180px]">{logoFile.name}</span>}
            </div>
          </div>
        </Card>
      ): <div className="text-sm text-zinc-500">Loading company...</div>}

      {/* Subscription & Billing */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Subscription & Billing</h3>
            <p className="text-xs text-zinc-500">Manage your Staflo plan and payment gateway</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Active Plan: Growth (Test Mode)
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Growth Plan</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">₹199 <span className="text-xs font-normal text-zinc-500">/ employee / month</span></p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Includes advanced payroll, 100GB document storage, meeting integration, and priority support.</p>
            <Button
              size="sm"
              className="mt-2 w-full bg-[#004E72] hover:bg-[#092634] text-white text-xs"
              onClick={() => {
                openRazorpayCheckout({
                  planName: 'Growth',
                  amountInINR: 199,
                  companyName: company?.name || 'Staflo Organization',
                  userEmail: user?.email,
                  onSuccess: (res) => {
                    setMsg(`✓ Payment successful! Razorpay ID: ${res.payment_id}. Subscription updated.`)
                  },
                  onError: (err) => {
                    if (err !== 'Payment modal closed by user') {
                      setMsg(`Payment error: ${err}`)
                    }
                  }
                })
              }}
            >
              Pay / Renew with Razorpay
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Enterprise Plan</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Custom <span className="text-xs font-normal text-zinc-500">/ custom billing</span></p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Custom integrations, dedicated database instance, tailored SLAs, and custom domain.</p>
            <Button size="sm" variant="outline" className="mt-2 w-full text-xs" onClick={() => window.location.href = 'mailto:sales@staflo.io'}>
              Contact Enterprise Sales
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Password & OTP Security */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#004E72]"/> Account Password & Security
          </h3>
          <span className="text-xs text-zinc-500">Requires 6-Digit Email OTP</span>
        </div>

        {!pwdOtpSent ? (
          <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Password change requests require 6-digit OTP code verification sent to <span className="font-medium text-zinc-800 dark:text-zinc-200">{user?.email}</span>.</p>
            <Button size="sm" onClick={requestPasswordOtp} disabled={pwdLoading} className="bg-[#004E72] hover:bg-[#092634] text-white text-xs">
              {pwdLoading ? 'Sending OTP…' : 'Send 6-Digit Verification OTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800">
            <div className="text-xs text-sky-800 dark:text-sky-200 flex items-center justify-between">
              <span>Enter current password, new password, and 6-digit email OTP:</span>
              <button type="button" onClick={requestPasswordOtp} disabled={pwdLoading} className="underline text-[11px] hover:text-sky-600">Resend Code</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <Input type="password" placeholder="Current Password" value={pwd.old} onChange={e=>setPwd({...pwd, old:e.target.value})} className="h-9 text-xs"/>
              <Input type="password" placeholder="New Password" value={pwd.next} onChange={e=>setPwd({...pwd, next:e.target.value})} className="h-9 text-xs"/>
              <Input type="password" placeholder="Confirm New" value={pwd.confirm} onChange={e=>setPwd({...pwd, confirm:e.target.value})} className="h-9 text-xs"/>
              <Input placeholder="6-Digit OTP" maxLength={6} value={pwdOtp} onChange={e=>setPwdOtp(e.target.value.replace(/\D/g,''))} className="h-9 text-xs font-mono font-bold tracking-widest text-center"/>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={changePwdWithOtp} disabled={pwdLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                {pwdLoading ? 'Verifying…' : 'Verify OTP & Change Password'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPwdOtpSent(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      {msg && <div className="text-xs p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white">{msg}</div>}
      {!isAdmin && <div className="text-xs text-amber-600 dark:text-amber-400">You are logged in as {user?.role} — only admin/hr can edit workspace organization settings.</div>}
    </div>
  )
}

