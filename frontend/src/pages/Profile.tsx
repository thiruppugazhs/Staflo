import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { useToast } from '../components/ui/toast'
import CommunicationHub from '../components/CommunicationHub'

function resolveFileUrl(url?: string){
  if(!url) return '#'
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

export default function Profile(){
  const { id: paramId } = useParams()
  const { user: me, fetchMe } = useAuth()
  const toast = useToast()
  const isMe = !paramId || paramId === 'me' || (me?.id && paramId === me.id)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<'resume'|'private'|'salary'>('resume')
  const [salary, setSalary] = useState<any>(null)
  const [formSalary, setFormSalary] = useState('50000')
  const [components, setComponents] = useState<any[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [docs, setDocs] = useState<any[]>([])
  const [pwd, setPwd] = useState({old:'', next:'', confirm:''})
  const [editField, setEditField] = useState<any>({phone: '', address: '', job_title: '', department: ''})
  const [company, setCompany] = useState<any>(null)

  const canViewSalary = me?.role !== 'employee' || isMe
  const canEditSalary = me?.role === 'admin' || me?.role === 'hr'
  const canEditAll = canEditSalary || isMe

  const load = async()=>{
    setLoading(true)
    setLoadError('')
    try{
      let userData: any = null
      if (isMe) {
        const { data } = await api.get('/users/me')
        userData = data
      } else if (paramId) {
        const { data } = await api.get(`/users/${paramId}`)
        userData = data
      }

      if (userData) {
        setUser(userData)
        setEditField({
          phone: userData.phone||'',
          address: userData.address||'',
          job_title: userData.job_title||'',
          department: userData.department||''
        })

        const effectiveId = userData.id
        if(canViewSalary){
          try{
            const s = await api.get(`/payroll/salary/${effectiveId}`)
            setSalary(s.data)
            if(s.data?.monthly_wage) setFormSalary(String(s.data.monthly_wage))
          }catch{}
          try{
            const c = await api.get('/payroll/components')
            setComponents(c.data)
          }catch{}
        }
        try{
          const d = await api.get(`/documents/${effectiveId}`)
          setDocs(d.data)
        }catch{}
      }
    }catch(err: any){
      setLoadError(err.response?.data?.detail || 'Failed to load user profile.')
    }finally{
      setLoading(false)
    }

    try{
      const c = await api.get('/companies/me')
      setCompany(c.data)
    }catch{}
  }

  useEffect(()=>{
    if (!me) fetchMe()
    load()
  },[paramId, me?.id])

  // Live preview: compute salary breakdown without saving (show all salary info)
  useEffect(()=>{
    if(tab!=='salary' || !canViewSalary) return
    const wage = parseFloat(formSalary)
    if(!wage || isNaN(wage) || wage<=0){ setPreview(null); return }
    // debounce
    const t = setTimeout(async()=>{
      try{
        const {data}= await api.post('/payroll/compute', {monthly_wage: wage})
        setPreview(data)
      }catch{ setPreview(null) }
    }, 350)
    return ()=> clearTimeout(t)
  },[formSalary, tab, components.length, canViewSalary])

  const saveSalary = async()=>{
    if(!user?.id) return
    setMsg('')
    try{
      const {data}= await api.post(`/payroll/salary/${user.id}`, {monthly_wage: parseFloat(formSalary)})
      setSalary(data)
      setMsg('Saved: Net Pay ' + data.breakdown.net_pay)
    }catch(e:any){ setMsg(e.response?.data?.detail || 'Failed')}
  }

  const seed = async()=>{
    try{
      await api.post('/payroll/seed-defaults')
      const c = await api.get('/payroll/components')
      setComponents(c.data)
      toast.success('Default salary components seeded ✓')
    }catch(e:any){ toast.error(e.response?.data?.detail || 'Failed to seed components') }
  }

  const uploadDoc = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]
    if(!file) return
    const targetId = user?.id || paramId || me?.id
    if(!targetId) return
    const fd = new FormData()
    fd.append('file', file)
    try{
      await api.post(`/documents/upload/${targetId}`, fd, {headers: {'Content-Type':'multipart/form-data'}})
      const d = await api.get(`/documents/${targetId}`)
      setDocs(d.data)
      toast.success(`Document "${file.name}" uploaded ✓`)
    }catch(ex:any){ toast.error(ex.response?.data?.detail || 'Upload failed') }
  }

  const saveProfile = async()=>{
    const targetId = user?.id || paramId || me?.id
    if(!targetId) return
    try{
      await api.patch(`/users/${targetId}`, editField)
      load()
      toast.success('Profile updated ✓')
    }catch(e:any){ toast.error(e.response?.data?.detail || 'Failed to update profile') }
  }

  const [pwdOtpSent, setPwdOtpSent] = useState(false)
  const [pwdOtp, setPwdOtp] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const requestPasswordOtp = async()=>{
    setPwdLoading(true)
    setMsg('')
    try{
      const { data } = await api.post('/auth/change-password-otp')
      setPwdOtpSent(true)
      toast.success(data.message || 'OTP sent to your email!')
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
      toast.success(data.message || 'Password changed successfully!')
      setPwd({old:'', next:'', confirm:''})
      setPwdOtp('')
      setPwdOtpSent(false)
    }catch(e:any){
      setMsg(e.response?.data?.detail || 'Failed to update password')
    }finally{
      setPwdLoading(false)
    }
  }

  const uploadAvatar = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]
    const targetId = user?.id || paramId || me?.id
    if(!file || !targetId) return
    const fd = new FormData()
    fd.append('file', file)
    try{
      await api.post(`/users/${targetId}/avatar`, fd, {headers:{'Content-Type':'multipart/form-data'}})
      load()
      toast.success('Profile picture updated ✓')
    }catch(ex:any){ toast.error(ex.response?.data?.detail || 'Avatar upload failed') }
  }

  if(loading && !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-3 border-[#004E72] border-t-transparent rounded-full mx-auto"/>
          <p className="text-xs text-zinc-500 font-medium">Loading profile details…</p>
        </div>
      </div>
    )
  }

  if(!user) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Card className="p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto font-bold text-lg">!</div>
          <h3 className="font-bold text-base">Profile unavailable</h3>
          <p className="text-xs text-zinc-500">{loadError || 'Could not load the requested user profile.'}</p>
          <Button size="sm" onClick={load} className="bg-[#004E72] text-white text-xs">Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/employees" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white inline-flex items-center gap-1">← Back to Employees</Link>
      <Card className="p-6">
        <div className="flex gap-4 items-center">
          <div className="h-16 w-16 rounded-full bg-[#004E72]/15 border-2 border-[#004E72]/30 flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
            {user.avatar_url ? <img src={resolveFileUrl(user.avatar_url)} alt="avatar" className="h-full w-full object-cover"/> : `${user.first_name[0]}${user.last_name[0]}`}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate text-zinc-900 dark:text-white">{user.first_name} {user.last_name}</h2>
            <div className="text-xs text-zinc-500 truncate">{user.employee_id} • <span className="capitalize font-medium text-violet-600 dark:text-violet-400">{user.role}</span> • {user.job_title || '—'} {company?.name && `• ${company.name}`}</div>
            <div className="text-xs text-zinc-500 truncate mt-0.5">{user.email} • {user.department || 'General'}</div>
            {(me?.id===user.id || isMe || me?.role!=='employee') && (
              <div className="mt-2">
                <label className="text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md cursor-pointer font-medium transition inline-flex items-center gap-1.5">
                  Change Profile Pic <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden"/>
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <Button variant={tab==='resume'?'default':'ghost'} size="sm" onClick={()=>setTab('resume')}>Resume</Button>
          <Button variant={tab==='private'?'default':'ghost'} size="sm" onClick={()=>setTab('private')}>Private Info</Button>
          <Button variant={tab==='salary'?'default':'ghost'} size="sm" onClick={()=>setTab('salary')} disabled={!canViewSalary}>Salary Info {(!canViewSalary) && '(Admin only)'}</Button>
        </div>
      </Card>

      {/* Communication Hub — Full Mode (Add ons.md Integration 3) */}
      {me?.id !== user.id && (
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2">Communication Hub <span className="text-xs font-normal text-zinc-500">• One-click Call, WhatsApp, Email, Meet</span></h3>
          <p className="text-xs text-zinc-500 mt-1">Contact {user.first_name} instantly — uses <code>tel:</code> / <code>wa.me</code> / <code>mailto:</code> / <code>POST /meetings/instant</code> (Add ons.md:184)</p>
          <div className="mt-3">
            <CommunicationHub user={user} currentUserId={me?.id} />
          </div>
        </Card>
      )}

      {tab==='resume' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold">About</h3>
            <p className="text-sm text-zinc-400">Resume view — personal + job + docs as per spec 3.3.1 (personal details, job details, salary structure, documents, profile picture). Admin edits all via Private Info; Salary in next tab.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">Full Name:</span> {user.first_name} {user.last_name}</div>
              <div><span className="text-zinc-500">Employee ID:</span> {user.employee_id}</div>
              <div><span className="text-zinc-500">Email:</span> {user.email}</div>
              <div><span className="text-zinc-500">Phone:</span> {user.phone || '—'}</div>
              <div><span className="text-zinc-500">Address:</span> {user.address || '—'}</div>
              <div><span className="text-zinc-500">Department:</span> {user.department || '—'}</div>
              <div><span className="text-zinc-500">Job Title:</span> {user.job_title || '—'}</div>
              <div><span className="text-zinc-500">Date of Joining:</span> {user.date_of_joining || '—'}</div>
              <div><span className="text-zinc-500">Company:</span> {company?.name || '—'} {company?.slug && `(${company.slug})`}</div>
              <div><span className="text-zinc-500">Role:</span> {user.role}</div>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="font-medium">Experience & Skills</h4>
              <ul className="text-sm text-zinc-400 list-disc ml-5 mt-2 space-y-1">
                <li>Experience data placeholder — integrate HRIS later</li>
                <li>Skills: React, FastAPI, Supabase (example)</li>
                <li>Education: B.E. Computer Science (example)</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h4 className="font-medium">Certifications & Documents</h4>
              <div className="text-sm text-zinc-400 mt-2">{docs.length} document(s) uploaded</div>
              <div className="mt-2 space-y-1">
                {docs.slice(0,3).map((d:any)=>(<div key={d.id} className="text-xs truncate">{d.name}</div>))}
                {docs.length===0 && <div className="text-xs text-zinc-500">No certs yet — upload in Private Info</div>}
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={()=>setTab('private')}>Manage Docs</Button>
            </Card>
          </div>
        </div>
      )}

      {tab==='private' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Private Info & Job Details (spec 3.3)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-xs text-zinc-500">Phone {me?.role==='employee'?'(editable)':''}</label><Input value={editField.phone} onChange={e=>setEditField({...editField, phone:e.target.value})} placeholder="Phone"/></div>
            <div><label className="text-xs text-zinc-500">Address</label><Input value={editField.address} onChange={e=>setEditField({...editField, address:e.target.value})} placeholder="Address"/></div>
            <div><label className="text-xs text-zinc-500">Job Title {canEditSalary ? '(admin editable)' : ''}</label><Input value={editField.job_title} onChange={e=>setEditField({...editField, job_title:e.target.value})} disabled={!canEditSalary && me?.id!==user.id} placeholder="Developer"/></div>
            <div><label className="text-xs text-zinc-500">Department</label><Input value={editField.department} onChange={e=>setEditField({...editField, department:e.target.value})} disabled={!canEditSalary && me?.id!==user.id} placeholder="Engineering"/></div>
          </div>
          <Button size="sm" onClick={saveProfile}>Save Profile</Button>
          <div className="text-xs text-zinc-500">Employees can edit limited fields (phone, address, avatar). Admin can edit all employee details (job, dept, role). Salary structure visible in Salary Info tab.</div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
            <h4 className="font-medium">Documents</h4>
            <input type="file" onChange={uploadDoc} className="text-sm"/>
            <div className="space-y-1">
              {docs.map((d:any)=>(
                <div key={d.id} className="flex justify-between items-center text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 hover:border-violet-300 dark:hover:border-violet-700 transition">
                  <div className="min-w-0 flex-1 truncate pr-2">{d.name} <span className="text-xs text-zinc-500">{d.mime_type}</span></div>
                  <a href={resolveFileUrl(d.file_url)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#004E72] hover:text-[#5a3d53] dark:text-violet-400 dark:hover:text-violet-300 px-2 py-1 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 shrink-0">View</a>
                </div>
              ))}
              {docs.length===0 && <div className="text-xs text-zinc-500">No documents — upload resume, ID, etc.</div>}
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Change Password {user.is_temp_password && <span className="text-amber-500 text-xs">— temp password, change required</span>}</h4>
              <span className="text-[11px] text-zinc-500">Requires 6-Digit Email OTP</span>
            </div>

            {!pwdOtpSent ? (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">To protect your account security, changing your password requires verifying a 6-digit OTP sent to <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.email}</span>.</p>
                <Button size="sm" onClick={requestPasswordOtp} disabled={pwdLoading} className="bg-[#004E72] hover:bg-[#092634] text-white text-xs">
                  {pwdLoading ? 'Sending OTP…' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800">
                <div className="text-xs text-sky-800 dark:text-sky-200 flex items-center justify-between">
                  <span>Enter Current Password, New Password, and the 6-Digit OTP sent to your email:</span>
                  <button type="button" onClick={requestPasswordOtp} disabled={pwdLoading} className="underline text-[11px] hover:text-sky-600">Resend OTP</button>
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
          </div>
          {msg && <div className="text-xs p-2.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">{msg}</div>}
        </Card>
      )}

      {tab==='salary' && canViewSalary && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Salary Info {canEditSalary ? '' : '(Read-only)'}</h3>
              {canEditSalary && <Button size="sm" variant="outline" onClick={seed}>Seed Default Components</Button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500">Monthly Wage</label>
                <Input value={formSalary} onChange={e=>setFormSalary(e.target.value)} disabled={!canEditSalary}/>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Yearly Wage</label>
                <Input value={String((parseFloat(formSalary)||0)*12)} disabled />
              </div>
            </div>
            {components.length>0 && <div className="text-xs text-zinc-500">Template components: {components.map(c=>`${c.name} ${c.value_type==='percentage'?c.value+'%'+(c.percentage_of? ' of '+c.percentage_of:''): '₹'+c.value} (${c.type})`).join(' • ')}</div>}
            {canEditSalary && <Button onClick={saveSalary}>Compute & Save Salary</Button>}
            {msg && <div className="text-sm p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">{msg}</div>}
            {(() => {
              const display = salary?.breakdown || preview
              if(!display) return <div className="text-xs text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3">Enter monthly wage to preview breakdown — includes Basic, HRA, PF, PT etc. {components.length===0 && 'Click Seed Default Components first.'}</div>
              const isPreview = !salary?.breakdown && !!preview
              return (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className={`px-3 py-2 text-sm font-medium flex justify-between ${isPreview ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
                  <span>{isPreview ? 'Preview' : 'Saved'} — Net Pay ₹{display.net_pay} / month {isPreview && '(not saved yet)'}</span>
                  <span className="text-xs font-normal opacity-70">₹{display.yearly_wage ?? display.monthly_wage*12}/yr</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-900/20 text-xs">
                  <div className="rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 text-center"><div className="text-zinc-500">Basic</div><div className="font-bold">₹{display.basic_amount}</div></div>
                  <div className="rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 text-center"><div className="text-emerald-700 dark:text-emerald-300">Earnings</div><div className="font-bold">₹{display.total_earnings}</div></div>
                  <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-center"><div className="text-red-700 dark:text-red-300">Deductions</div><div className="font-bold">₹{display.total_deductions}</div></div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 text-xs"><tr><th className="text-left p-2">Component</th><th className="text-right p-2">Type</th><th className="text-right p-2">Monthly</th><th className="text-right p-2">Yearly</th></tr></thead>
                  <tbody>
                    {display.breakdown.map((b:any,i:number)=>(
                      <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800"><td className="p-2">{b.name} <span className="text-xs text-zinc-500">{b.value_type==='percentage' ? `${b.value}%${b.percentage_of ? ' of '+b.percentage_of : ''}` : ''}</span></td><td className="p-2 text-right text-xs capitalize"><span className={`px-1.5 py-0.5 rounded text-[11px] ${b.type==='earning' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>{b.type}</span></td><td className="p-2 text-right">₹{b.amount_monthly}</td><td className="p-2 text-right">₹{b.amount_yearly}</td></tr>
                    ))}
                  </tbody>
                </table>
                {display.warnings?.length>0 && <div className="p-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">{display.warnings.join(', ')}</div>}
                {isPreview && canEditSalary && <div className="p-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">Click Compute & Save Salary to persist this structure for {user.first_name}.</div>}
              </div>
              )
            })()}
          </Card>
        </div>
      )}
    </div>
  )
}
