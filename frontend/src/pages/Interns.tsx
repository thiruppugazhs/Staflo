import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { useToast } from '../components/ui/toast'
import { Link } from 'react-router-dom'
import {
  GraduationCap, UserPlus, X, Award, CalendarClock, Wallet, TrendingUp,
  UserCheck, CalendarPlus, Square, FileDown, ClipboardCheck, Users
} from 'lucide-react'

type Intern = {
  id: string, user_id: string, name: string, employee_id: string, email: string,
  mentor_id?: string | null, mentor_name?: string | null, mentor_email?: string | null, mentor_phone?: string | null, department?: string,
  start_date: string, end_date: string, stipend: number, status: string,
  project_title?: string, institute?: string, evaluation_score?: number | null,
  day: number, total_days: number, percent: number, midterm_due: boolean,
  final_due: boolean, days_remaining: number, conversion_status: string,
  evaluations: any[], avatar_url?: string | null
}

const statusColor: Record<string,string> = {
  active:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  extended:'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  completed:'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  converted:'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  terminated:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}
const bandColor: Record<string,string> = {
  outstanding:'bg-amber-400 text-amber-950',
  excellent:'bg-emerald-500 text-white',
  good:'bg-sky-500 text-white',
  average:'bg-amber-500 text-white',
  below_expectations:'bg-red-500 text-white',
}

export default function Interns(){
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const isIntern = user?.role === 'intern'
  const [interns, setInterns] = useState<Intern[]>([])
  const [stats, setStats] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [msg, setMsg] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [evaluateFor, setEvaluateFor] = useState<Intern | null>(null)
  const [extendFor, setExtendFor] = useState<Intern | null>(null)
  const [form, setForm] = useState({user_id:'', mentor_id:'', start_date:'', end_date:'', stipend:'', project_title:'', institute:'', department:''})
  const [evalForm, setEvalForm] = useState({evaluation_type:'midterm', technical:7, communication:7, teamwork:7, punctuality:7, initiative:7, strengths:'', improvements:'', recommendation:''})
  const [extendEnd, setExtendEnd] = useState('')

  const load = async()=>{
    if(isAdmin){
      try{ const {data}=await api.get('/interns'); setInterns(data) }catch{}
      try{ const {data}=await api.get('/interns/stats'); setStats(data) }catch{}
      try{ const {data}=await api.get('/users'); setEmployees(data) }catch{}
    } else if(isIntern){
      try{ const {data}=await api.get('/interns/my-internship'); setInterns([data]) }catch{}
    } else {
      try{ const {data}=await api.get('/interns/my-interns'); setInterns(data) }catch{}
    }
  }
  useEffect(()=>{ load() },[])

  const create = async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg('')
    if(!form.user_id) return setMsg('Pick the invited user')
    if(!form.start_date || !form.end_date) return setMsg('Start and end dates required')
    try{
      await api.post('/interns', {...form, stipend: form.stipend ? parseFloat(form.stipend) : 0, mentor_id: form.mentor_id || undefined})
      setShowCreate(false)
      setForm({user_id:'', mentor_id:'', start_date:'', end_date:'', stipend:'', project_title:'', institute:'', department:''})
      await load()
      toast.success('Internship created ✓')
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Failed') }
  }

  const submitEval = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!evaluateFor) return
    try{
      await api.post(`/interns/${evaluateFor.user_id}/evaluate`, {
        ...evalForm,
        recommendation: evalForm.evaluation_type==='final' ? evalForm.recommendation : undefined
      })
      setMsg(`Evaluation saved for ${evaluateFor.name}`)
      setEvaluateFor(null); await load()
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Evaluate failed') }
  }

  const doConvert = async(i:Intern)=>{
    if(!confirm(`Convert ${i.name} to full-time employee?`)) return
    try{ await api.post(`/interns/${i.user_id}/convert`); await load(); toast.success(`${i.name} converted to full-time employee ✓`) }catch(ex:any){ toast.error(ex.response?.data?.detail||'Convert failed') }
  }
  const doExtend = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!extendFor || !extendEnd) return
    try{
      await api.post(`/interns/${extendFor.user_id}/extend`, {end_date: extendEnd})
      toast.success(`Internship extended for ${extendFor.name} until ${extendEnd} ✓`)
      setExtendFor(null); setExtendEnd(''); await load()
    }catch(ex:any){ toast.error(ex.response?.data?.detail||'Extend failed') }
  }
  const doEnd = async(i:Intern)=>{
    if(!confirm(`End internship for ${i.name}? Account will be deactivated.`)) return
    try{ await api.post(`/interns/${i.user_id}/end`); await load(); toast.success(`Internship ended for ${i.name} ✓`) }catch(ex:any){ toast.error(ex.response?.data?.detail||'Failed to end internship') }
  }

  const filtered = interns.filter(i=> !filterStatus || i.status===filterStatus)

  // ===== INTERN SELF VIEW =====
  if(isIntern){
    const me = interns[0]
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><GraduationCap className="h-6 w-6 text-emerald-600"/> My Internship</h1>
          <p className="text-sm text-zinc-500 mt-1">Progress • Mentor • Stipend • Evaluations</p>
        </div>
        {!me ? (
          <Card className="p-12 text-center"><GraduationCap className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/><div className="mt-3 font-medium">No internship record yet</div><div className="text-sm text-zinc-500">Ask your admin to onboard you via Intern Management.</div></Card>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Internship Progress</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor[me.status]||''}`}>{me.status}</span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1"><span>Day {me.day} of {me.total_days}</span><span>{me.percent}% complete</span></div>
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all" style={{width:`${me.percent}%`}}/>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{me.start_date} → {me.end_date} • {me.days_remaining} day(s) remaining</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><div className="text-xs text-zinc-500">Project</div><div className="font-medium truncate">{me.project_title || '—'}</div></div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><div className="text-xs text-zinc-500">Department</div><div className="font-medium truncate">{me.department || '—'}</div></div>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4"/> My Stipend</h3>
                <div className="mt-3 text-3xl font-bold">₹{me.stipend.toLocaleString()}<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                <p className="text-xs text-zinc-500 mt-1">Total expected ≈ ₹{(me.stipend * (me.total_days/30)).toLocaleString(undefined,{maximumFractionDigits:0})} over the internship.</p>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/> Mentor</h3>
              {me.mentor_name ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#eab308] to-[#9B6B8A] text-white flex items-center justify-center text-sm font-bold">{me.mentor_name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                  <div className="flex-1">
                    <div className="font-medium">{me.mentor_name}</div>
                    <div className="text-xs text-zinc-500">{me.mentor_email}{me.mentor_phone ? ` • ${me.mentor_phone}` : ''}</div>
                  </div>
                  {me.mentor_email && <a href={`mailto:${me.mentor_email}`} className="text-xs px-3 h-8 inline-flex items-center rounded-md border hover:bg-zinc-50 dark:hover:bg-zinc-800">Email</a>}
                  {me.mentor_phone && <a href={`tel:${me.mentor_phone}`} className="text-xs px-3 h-8 inline-flex items-center rounded-md border hover:bg-zinc-50 dark:hover:bg-zinc-800">Call</a>}
                </div>
              ) : <div className="text-sm text-zinc-500 mt-2">No mentor assigned yet.</div>}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4"/> My Evaluations</h3>
              {me.evaluations.length===0 ? <div className="text-sm text-zinc-500 mt-2">No evaluations yet — they appear after your mentor submits.</div> : (
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  {me.evaluations.map(ev=>(
                    <div key={ev.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold capitalize">{ev.type} Evaluation</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bandColor[ev.band]}`}>{ev.overall_score}/100</span>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px]">
                        {[['Tech',ev.technical],['Comm',ev.communication],['Team',ev.teamwork],['Punct',ev.punctuality],['Init',ev.initiative]].map(([l,v])=>(
                          <div key={l as string}><div className="font-bold text-sm">{v}/10</div><div className="text-zinc-500">{l}</div></div>
                        ))}
                      </div>
                      {ev.strengths && <p className="mt-2 text-xs"><b>Strengths:</b> {ev.strengths}</p>}
                      {ev.improvements && <p className="text-xs"><b>Improvements:</b> {ev.improvements}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><GraduationCap className="h-6 w-6 text-emerald-600"/> Intern Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Lifecycle: onboarding → progress → midterm/final evaluation → convert/extend/end {isAdmin ? '(Add ons.md Feature 4)' : '— interns assigned to you'}</p>
        </div>
        {isAdmin && <Button onClick={()=>setShowCreate(true)} className="gap-2"><UserPlus className="h-4 w-4"/> New Internship</Button>}
      </div>

      {/* Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {label:'Active', val:stats.active, icon:TrendingUp, c:'bg-emerald-500'},
            {label:'Ending ≤7 days', val:stats.ending_within_7_days, icon:CalendarClock, c:'bg-amber-500'},
            {label:'Pending evals', val:stats.pending_evaluations, icon:ClipboardCheck, c:'bg-sky-500'},
            {label:'Awaiting decision', val:stats.awaiting_decision, icon:Award, c:'bg-violet-500'},
            {label:'Total interns', val:stats.total_interns, icon:GraduationCap, c:'bg-zinc-900 dark:bg-white'},
          ].map(s=>(
            <Card key={s.label} className="p-4">
              <div className={`h-8 w-8 rounded-lg ${s.c} text-white flex items-center justify-center`}><s.icon className="h-4 w-4"/></div>
              <div className="mt-2 text-2xl font-bold">{s.val ?? 0}</div>
              <div className="text-xs text-zinc-500">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {['','active','extended','completed','converted'].map(s=>(
            <button key={s||'all'} onClick={()=>setFilterStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition ${filterStatus===s ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>{s||'all'}</button>
          ))}
        </div>
      )}

      {msg && <div className="text-sm p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">{msg}</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length===0 ? (
          <Card className="p-12 col-span-full text-center">
            <GraduationCap className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/>
            <div className="mt-3 font-medium">{isAdmin ? 'No interns yet' : 'No interns assigned to you'}</div>
            {isAdmin && <div className="text-sm text-zinc-500">Invite a user first (Dashboard → Invite), then click New Internship.</div>}
          </Card>
        ) : filtered.map(i=>(
          <Card key={i.id} className="p-4 flex flex-col">
            <div className="flex items-start gap-3">
              <Link to={`/profile/${i.user_id}`} className="h-11 w-11 rounded-full bg-gradient-to-br from-[#eab308] to-[#9B6B8A] text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                {i.avatar_url ? <img src={i.avatar_url} className="h-full w-full object-cover"/> : i.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${i.user_id}`} className="font-medium truncate hover:underline">{i.name}</Link>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusColor[i.status]||''}`}>{i.status}</span>
                </div>
                <div className="text-xs text-zinc-500 truncate">{i.employee_id} • {i.department || '—'}{i.institute ? ` • ${i.institute}` : ''}</div>
                <div className="text-xs text-zinc-500 truncate">Mentor: {i.mentor_name || '—'}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1"><span>Day {i.day}/{i.total_days}</span><span>{i.percent}%</span></div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{width:`${i.percent}%`}}/>
              </div>
            </div>

            {(i.midterm_due || i.final_due) && (
              <div className="mt-2 text-[11px] px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 self-start">
                <CalendarClock className="h-3 w-3"/> {i.final_due ? 'Final evaluation due' : 'Midterm evaluation due'}
              </div>
            )}

            {i.evaluation_score != null && (
              <div className="mt-2 text-xs">Latest score: <b>{i.evaluation_score}/100</b></div>
            )}

            <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1"><Wallet className="h-3 w-3"/> ₹{i.stipend.toLocaleString()}/mo stipend{i.project_title ? ` • ${i.project_title}` : ''}</div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
              {(isMentorOf(i) || isAdmin) && i.status!=='converted' && i.status!=='completed' && (
                <button onClick={()=>setEvaluateFor(i)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"><ClipboardCheck className="h-3 w-3"/> Evaluate</button>
              )}
              {isAdmin && i.status!=='converted' && (
                <>
                  <button onClick={()=>doConvert(i)} title="Convert to employee" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600"><UserCheck className="h-3 w-3"/> Convert</button>
                  <button onClick={()=>setExtendFor(i)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-600"><CalendarPlus className="h-3 w-3"/> Extend</button>
                  <button onClick={()=>doEnd(i)} title="End internship" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"><Square className="h-3 w-3"/> End</button>
                </>
              )}
              {isAdmin && (
                <a href={`${(import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api/v1')}/interns/${i.user_id}/certificate`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"><FileDown className="h-3 w-3"/> Certificate</a>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title={<span className="flex items-center gap-2"><UserPlus className="h-5 w-5"/> New Internship</span>} onClose={()=>setShowCreate(false)}>
          <form onSubmit={create} className="space-y-3">
            <p className="text-xs text-zinc-500">Invite first (Dashboard → Invite Employee). Creating sets role=<b>intern</b>, reduced leave 3 paid + 2 sick for the whole internship.</p>
            <select value={form.user_id} onChange={e=>setForm({...form, user_id:e.target.value})} className={selectCls}>
              <option value="">Select intern user *</option>
              {employees.filter(e=>e.role==='employee'||e.role==='intern').map(emp=>(
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} • {emp.employee_id} ({emp.role})</option>
              ))}
            </select>
            <select value={form.mentor_id} onChange={e=>setForm({...form, mentor_id:e.target.value})} className={selectCls}>
              <option value="">Assign mentor (optional)</option>
              {employees.map(emp=>(
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} • {emp.role}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Start date *</label><Input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></div>
              <div><label className={labelCls}>End date *</label><Input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Monthly stipend (₹)</label><Input type="number" min="0" value={form.stipend} onChange={e=>setForm({...form,stipend:e.target.value})} placeholder="15000"/></div>
              <div><label className={labelCls}>Department</label><Input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Engineering"/></div>
            </div>
            <div><label className={labelCls}>Project title</label><Input value={form.project_title} onChange={e=>setForm({...form,project_title:e.target.value})} placeholder="HRMS chatbot"/></div>
            <div><label className={labelCls}>Institute</label><Input value={form.institute} onChange={e=>setForm({...form,institute:e.target.value})} placeholder="IIT Delhi"/></div>
            <Button type="submit" className="w-full">Create Internship</Button>
            {msg && <div className="text-sm p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600">{msg}</div>}
          </form>
        </Modal>
      )}

      {/* Evaluate modal */}
      {evaluateFor && (
        <Modal title={<span className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5"/> Evaluate {evaluateFor.name}</span>} onClose={()=>setEvaluateFor(null)}>
          <form onSubmit={submitEval} className="space-y-3">
            <div className="flex gap-2">
              {['midterm','final'].map(t=>(
                <button type="button" key={t} onClick={()=>setEvalForm(f=>({...f, evaluation_type:t}))} className={`flex-1 h-9 rounded-md text-sm font-medium capitalize border transition ${evalForm.evaluation_type===t?'bg-violet-600 text-white border-violet-600':'border-zinc-200 dark:border-zinc-700'}`}>{t}</button>
              ))}
            </div>
            {([['technical','Technical Skills (30%)'],['communication','Communication (20%)'],['teamwork','Teamwork (20%)'],['punctuality','Punctuality (15%)'],['initiative','Initiative (15%)']] as const).map(([field,label])=>(
              <div key={field} className="flex items-center gap-3">
                <span className="text-sm flex-1">{label}</span>
                <input type="range" min={1} max={10} value={(evalForm as any)[field]} onChange={e=>setEvalForm(f=>({...f, [field]:parseInt(e.target.value)}))} className="w-32 accent-[#eab308]"/>
                <span className="w-10 text-right text-sm font-bold">{(evalForm as any)[field]}/10</span>
              </div>
            ))}
            <div className="text-sm p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">Weighted overall: <b>{((evalForm.technical*0.3+evalForm.communication*0.2+evalForm.teamwork*0.2+evalForm.punctuality*0.15+evalForm.initiative*0.15)*10).toFixed(1)}/100</b></div>
            <div className="grid md:grid-cols-2 gap-2">
              <div><label className={labelCls}>Strengths</label><Input value={evalForm.strengths} onChange={e=>setEvalForm(f=>({...f,strengths:e.target.value}))}/></div>
              <div><label className={labelCls}>Areas to improve</label><Input value={evalForm.improvements} onChange={e=>setEvalForm(f=>({...f,improvements:e.target.value}))}/></div>
            </div>
            {evalForm.evaluation_type==='final' && (
              <div>
                <label className={labelCls}>Recommendation (admin only)</label>
                <select value={evalForm.recommendation} onChange={e=>setEvalForm(f=>({...f,recommendation:e.target.value}))} className={selectCls}>
                  <option value="">Select *</option>
                  <option value="convert">Convert to Employee</option>
                  <option value="extend">Extend Internship</option>
                  <option value="end">End Internship</option>
                </select>
              </div>
            )}
            <Button type="submit" className="w-full">Submit Evaluation</Button>
          </form>
        </Modal>
      )}

      {/* Extend modal */}
      {extendFor && (
        <Modal title={<span className="flex items-center gap-2"><CalendarPlus className="h-5 w-5"/> Extend {extendFor.name}</span>} onClose={()=>setExtendFor(null)}>
          <form onSubmit={doExtend} className="space-y-3">
            <p className="text-xs text-zinc-500">Current end date: {extendFor.end_date}. New date must be later; leave allocation does not roll over.</p>
            <div><label className={labelCls}>New end date *</label><Input type="date" value={extendEnd} onChange={e=>setExtendEnd(e.target.value)}/></div>
            <Button type="submit" className="w-full">Extend Internship</Button>
          </form>
        </Modal>
      )}
    </div>
  )
}

const selectCls = "h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm w-full"
const labelCls = "text-xs text-zinc-500"

function isMentorOf(_i: Intern){ return true } // server enforces real mentor check

function Modal({title, children, onClose}:{title:any, children:React.ReactNode, onClose:()=>void}){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <Card className="relative w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-4 w-4"/></button>
        </div>
        {children}
      </Card>
    </div>
  )
}
