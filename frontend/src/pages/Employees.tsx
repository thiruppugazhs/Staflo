import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { UserPlus, Shield, Building2, Mail, ArrowUpRight, Search, X, CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import CommunicationHub from '../components/CommunicationHub'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

type Employee = {
  id: string, employee_id: string, email: string, first_name: string, last_name: string,
  role: string, avatar_url?: string, department?: string, job_title?: string, phone?: string
}

export default function Employees(){
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search,setSearch]=useState('')
  const [todayMap,setTodayMap]=useState<Record<string,string>>({})
  const [showInvite,setShowInvite]=useState(false)
  const [invite,setInvite]=useState({firstName:'',lastName:'',email:'',jobTitle:'',department:'', role:'employee'})
  const [msg,setMsg]=useState('')
  const [result,setResult]=useState<{id:string, employee_id:string, temp_password:string, name:string}|null>(null)
  const [toast,setToast]=useState<{name:string, employee_id:string}|null>(null)
  const [highlightId,setHighlightId]=useState('')
  const [copied,setCopied]=useState('')
  const [creating,setCreating]=useState(false)

  const load = async()=>{
    try{
      const {data} = await api.get('/users', {params: {search: search || undefined}})
      setEmployees(data)
    }catch{}
    // Attendance dots are admin/HR only (backend /attendance/today/batch is 403 for employees)
    if(isAdmin){
      try{
        const b = await api.get('/attendance/today/batch')
        const m:Record<string,string>={}
        b.data.forEach((x:any)=> m[x.user_id]=x.status)
        setTodayMap(m)
      }catch{}
    }
  }
  useEffect(()=>{ load() },[search])

  const doInvite = async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg(''); setResult(null)
    setCreating(true)
    try{
      const {data}=await api.post('/auth/invite', invite)
      setResult({id:data.id, employee_id:data.employee_id, temp_password:data.temp_password, name:`${invite.firstName} ${invite.lastName}`.trim()})
      setHighlightId(data.id)
      setTimeout(()=>setHighlightId(''), 8000)
      load() // refresh grid so the new card appears immediately
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Invite failed')}
    finally{ setCreating(false)}
  }

  const closeInvite = ()=>{
    setShowInvite(false)
    if(result){
      setToast({name:result.name, employee_id:result.employee_id})
      setTimeout(()=>setToast(null), 6000)
      setResult(null)
      setInvite({firstName:'',lastName:'',email:'',jobTitle:'',department:'', role:'employee'})
    }
  }

  const copyText = async(text:string, key:string)=>{
    try{
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(()=>setCopied(''), 1500)
    }catch{}
  }

  const hasAttendance = Object.keys(todayMap).length > 0

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees ({employees.length})</h1>
          {hasAttendance && <p className="text-sm text-zinc-500 mt-1">Click card for profile • dots = today attendance</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
            <Input placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 w-64 bg-white dark:bg-zinc-900"/>
          </div>
          {isAdmin && <Button onClick={()=>setShowInvite(true)} className="gap-2"><UserPlus className="h-4 w-4"/> Invite Employee</Button>}
        </div>
      </div>
      <div className="sm:hidden relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
        <Input placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 w-full bg-white dark:bg-zinc-900"/>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp=>{
          const st=todayMap[emp.id]||'absent'
          const color=st==='present'?'bg-emerald-500':st==='half_day'?'bg-amber-500':st==='leave'?'bg-yellow-500':'bg-red-500'
          return (
            <Card key={emp.id} className={`p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition h-full relative group flex flex-col ${emp.id===highlightId ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`}>
              <Link to={`/profile/${emp.id}`} className="flex-1">
                {hasAttendance && <div className={`absolute top-3 right-3 h-3 w-3 rounded-full ${color} ring-2 ring-white dark:ring-zinc-900`} title={`Attendance: ${st}`} />}
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden text-zinc-600 dark:text-zinc-200">
                    {emp.avatar_url ? <img src={resolveFileUrl(emp.avatar_url)} className="h-full w-full object-cover"/> : `${emp.first_name[0]}${emp.last_name[0]}`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-1">{emp.first_name} {emp.last_name} {emp.role!=='employee' && <Shield className="h-3 w-3 text-violet-500"/>}</div>
                    <div className="text-xs text-zinc-500 truncate flex items-center gap-1"><Mail className="h-3 w-3"/> {emp.employee_id} • {emp.role}</div>
                    <div className="text-xs text-zinc-400 truncate flex items-center gap-1"><Building2 className="h-3 w-3"/> {emp.department || '—'} • {emp.job_title || ''}</div>
                    <div className="text-xs text-zinc-500 truncate">{emp.email}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  {hasAttendance ? (
                    <span className={`px-2 py-1 rounded-full ${st==='present'?'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': st==='half_day'?'bg-amber-50 text-amber-700':'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{st==='present'?'Present today': st==='half_day'?'Half-day': st==='leave'?'On leave':'Absent'}</span>
                  ) : <span/>}
                  <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1">View <ArrowUpRight className="h-3 w-3"/></span>
                </div>
              </Link>
              {/* Communication Hub — Compact Mode (Add ons.md Integration 3) */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">Contact:</span>
                <CommunicationHub user={emp} compact currentUserId={user?.id} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInvite}/>
          <Card className="relative w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2"><UserPlus className="h-5 w-5"/> Invite Employee</h3>
              <button onClick={closeInvite} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
            {result ? (
              /* ===== Success state — stays open until user closes ===== */
              <div className="mt-4 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h4 className="mt-3 font-semibold text-lg">Employee created!</h4>
                <p className="text-sm text-zinc-500 mt-1"><span className="font-medium text-zinc-700 dark:text-zinc-300">{result.name}</span> has been added to your workspace. Share these credentials securely — <span className="font-medium text-amber-600 dark:text-amber-400">they won't be shown again</span>.</p>
                <div className="mt-4 space-y-2 text-left">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-zinc-400">Login ID (Employee ID)</div>
                      <div className="font-mono text-sm font-medium">{result.employee_id}</div>
                    </div>
                    <button type="button" onClick={()=>copyText(result.employee_id,'id')} className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 shrink-0"><Copy className="h-3 w-3"/>{copied==='id'?'Copied!':'Copy'}</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-zinc-400">Temporary password</div>
                      <div className="font-mono text-sm font-medium select-all">{result.temp_password}</div>
                    </div>
                    <button type="button" onClick={()=>copyText(result.temp_password,'pw')} className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 shrink-0"><Copy className="h-3 w-3"/>{copied==='pw'?'Copied!':'Copy'}</button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">The new employee must verify their email and set a permanent password on first login.</p>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={()=>{setResult(null); setMsg('')}}>Invite another</Button>
                  <Button className="flex-1" onClick={closeInvite}>Done</Button>
                </div>
              </div>
            ) : (
              /* ===== Form state ===== */
              <>
                <p className="text-xs text-zinc-500 mt-1">Auto Employee ID (OS0001…) + temp password • Email verification required • Cannot self-register</p>
                <form onSubmit={doInvite} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="First Name" value={invite.firstName} onChange={e=>setInvite({...invite, firstName:e.target.value})} required/>
                  <Input placeholder="Last Name" value={invite.lastName} onChange={e=>setInvite({...invite, lastName:e.target.value})} required/>
                  <Input placeholder="Email" type="email" value={invite.email} onChange={e=>setInvite({...invite, email:e.target.value})} required className="md:col-span-2"/>
                  <Input placeholder="Job Title" value={invite.jobTitle} onChange={e=>setInvite({...invite, jobTitle:e.target.value})} />
                  <Input placeholder="Department" value={invite.department} onChange={e=>setInvite({...invite, department:e.target.value})} />
                  <select value={invite.role} onChange={e=>setInvite({...invite, role:e.target.value})} className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm md:col-span-2">
                    <option value="employee">Employee</option>
                    <option value="hr">HR Officer</option>
                    <option value="admin">Admin</option>
                    <option value="intern">Intern</option>
                  </select>
                  <Button type="submit" disabled={creating} className="md:col-span-2">{creating ? 'Inviting…' : 'Invite & Generate ID'}</Button>
                </form>
                {msg && <div className="mt-3 text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>{msg}</div>}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Created-successfully toast */}
      {toast && (
        <div className="fixed top-16 right-4 z-[60] max-w-sm w-full sm:w-auto">
          <Card className="overflow-hidden shadow-xl border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 p-0">
            <div className="flex items-start gap-3 p-4">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Employee created 🎉</div>
                <div className="text-xs text-zinc-500 mt-0.5">{toast.name || 'New teammate'} joined as <span className="font-mono">{toast.employee_id}</span>. Credentials were shown once — share them securely.</div>
              </div>
              <button onClick={()=>setToast(null)} className="shrink-0 h-6 w-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-3.5 w-3.5"/></button>
            </div>
            <div className="h-1 bg-emerald-500"/>
          </Card>
        </div>
      )}
    </div>
  )
}
