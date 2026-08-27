import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { useToast } from '../components/ui/toast'
import { Link } from 'react-router-dom'
import { Video, CalendarPlus, X, Copy, Check, Users, Radio, CalendarClock, Trash2, ExternalLink, Search } from 'lucide-react'

type Meeting = {
  id: string, title: string, description?: string, meet_link?: string,
  start_time: string, end_time: string, status: string, organizer_id: string,
  attendee_ids: string[], is_live?: boolean, attendee_count?: number
}

function fmt(iso: string){
  return new Date(iso).toLocaleString('en-US', {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})
}

export default function Meetings(){
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [msg, setMsg] = useState('')
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [createdDemo, setCreatedDemo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'upcoming'|'all'>('upcoming')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({title:'', description:'', date:'', startTime:'', endTime:'', attendees: [] as string[]})
  const [submitting, setSubmitting] = useState(false)

  const load = async()=>{
    try{
      if(tab==='upcoming'){ const {data}=await api.get('/meetings/upcoming'); setMeetings(data) }
      else { const {data}=await api.get('/meetings'); setMeetings(data) }
    }catch{ setMeetings([]) }
  }
  useEffect(()=>{ load() },[tab])
  useEffect(()=>{ (async()=>{ try{ const {data}=await api.get('/users'); setEmployees(data) }catch{ setEmployees([]) } })() },[])

  const toggleAttendee = (id:string)=>{
    setForm(f=> ({...f, attendees: f.attendees.includes(id) ? f.attendees.filter(x=>x!==id) : [...f.attendees, id]}))
  }

  const schedule = async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg('')
    if(!form.title || form.title.trim().length<3) return setMsg('Title required (3+ chars)')
    if(!form.date || !form.startTime || !form.endTime) return setMsg('Pick date + start/end time')
    if(form.attendees.length===0) return setMsg('Select at least one attendee')
    setSubmitting(true)
    try{
      const {data} = await api.post('/meetings', {
        title: form.title.trim(),
        description: form.description || undefined,
        start_time: new Date(`${form.date}T${form.startTime}:00`).toISOString(),
        end_time: new Date(`${form.date}T${form.endTime}:00`).toISOString(),
        attendee_ids: form.attendees
      })
      setCreatedLink(data.meet_link)
      setCreatedDemo(data.source === 'mock')
      setForm({title:'', description:'', date:'', startTime:'', endTime:'', attendees: []})
      await load()
      setTimeout(()=>{ setShowSchedule(false); setCreatedLink(null); setCreatedDemo(false) }, 2500)
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Failed to schedule') }
    finally{ setSubmitting(false) }
  }

  const instantMeet = async()=>{
    setMsg('')
    try{
      const {data} = await api.post('/meetings/instant')
      if(data.meet_link){ window.open(data.meet_link, '_blank'); setMsg(`Instant Meet created: ${data.meet_link}`) }
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Failed') }
  }

  const cancelMeeting = async(id:string)=>{
    if(!confirm('Cancel this meeting?')) return
    try{ await api.delete(`/meetings/${id}`); await load(); toast.success('Meeting cancelled ✓') }catch(ex:any){ toast.error(ex.response?.data?.detail||'Cancel failed') }
  }

  const copy = async(link:string)=>{
    await navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false), 1500)
  }

  const filtered = meetings.filter(m=> !search || m.title.toLowerCase().includes(search.toLowerCase()))
  const nameOf = (id:string)=>{ const e=employees.find(x=>x.id===id); return e ? `${e.first_name} ${e.last_name}` : id.slice(0,8) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Video className="h-6 w-6 text-violet-600"/> Meetings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={instantMeet} className="gap-2"><Radio className="h-4 w-4"/> Instant Meet</Button>
          {isAdmin && <Button onClick={()=>setShowSchedule(true)} className="gap-2"><CalendarPlus className="h-4 w-4"/> Schedule Meeting</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(['upcoming','all'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition ${tab===t ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-violet-300'}`}>{t}</button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
          <Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 w-48 bg-white dark:bg-zinc-900"/>
        </div>
      </div>

      {msg && <div className="text-sm p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200 break-all">{msg}</div>}

      {/* Meeting list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length===0 ? (
          <Card className="p-12 col-span-full text-center">
            <Video className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/>
            <div className="mt-3 font-medium">No {tab} meetings</div>
            <div className="text-sm text-zinc-500">{isAdmin ? 'Schedule one or create an Instant Meet.' : 'You will see meetings you are invited to here.'}</div>
          </Card>
        ) : filtered.map(m=>{
          const isLive = m.is_live || (new Date(m.start_time) <= new Date() && new Date() <= new Date(m.end_time))
          return (
            <Card key={m.id} className={`p-4 relative ${isLive ? 'border-red-400 dark:border-red-700 ring-1 ring-red-300/50' : ''}`}>
              {isLive && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"/> LIVE
                </span>
              )}
              <h3 className="font-semibold truncate pr-14">{m.title}</h3>
              {m.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{m.description}</p>}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500"><CalendarClock className="h-3.5 w-3.5"/> {fmt(m.start_time)} → {fmt(m.end_time)}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                <Users className="h-3.5 w-3.5"/> {m.attendee_count ?? m.attendee_ids?.length ?? 0} attendee(s)
                {m.attendee_ids?.length>0 && m.attendee_ids.length<=3 && <span className="truncate">• {m.attendee_ids.map(nameOf).join(', ')}</span>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {isLive ? (
                  <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition">
                    Join Now <ExternalLink className="h-3.5 w-3.5"/>
                  </a>
                ) : (
                  <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition">
                    Join <ExternalLink className="h-3.5 w-3.5"/>
                  </a>
                )}
                {m.meet_link && (
                  <button onClick={()=>copy(m.meet_link!)} title="Copy link" className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
                  </button>
                )}
                {isAdmin && m.status==='scheduled' && (
                  <button onClick={()=>cancelMeeting(m.id)} title="Cancel meeting" className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>{setShowSchedule(false); setCreatedLink(null); setCreatedDemo(false)}}/>
          <Card className="relative w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2"><CalendarPlus className="h-5 w-5"/> Schedule Meeting</h3>
              <button onClick={()=>{setShowSchedule(false); setCreatedLink(null); setCreatedDemo(false)}} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
            {createdLink ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Meeting scheduled ✓</div>
                  <div className="mt-2 text-xs font-mono break-all bg-white dark:bg-zinc-900 p-2 rounded border">{createdLink}</div>
                  {createdDemo && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Demo link — Google Calendar API is not configured on the server, so this Meet code won't work.</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>copy(createdLink)} className="flex-1 h-9 rounded-md border text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">{copied?'Copied ✓':'Copy Link'}</button>
                  <a href={createdLink} target="_blank" rel="noopener noreferrer" className="flex-1 h-9 rounded-md bg-violet-600 text-white text-sm font-medium flex items-center justify-center hover:bg-violet-700">Open Meet</a>
                </div>
              </div>
            ) : (
              <form onSubmit={schedule} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Title * (3-200 chars)</label>
                  <Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Weekly standup" maxLength={200}/>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Description (max 1000)</label>
                  <Input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Agenda..." maxLength={1000}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-zinc-500">Date *</label>
                    <Input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Start *</label>
                    <Input type="time" value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">End *</label>
                    <Input type="time" value={form.endTime} onChange={e=>setForm({...form, endTime:e.target.value})}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Attendees * ({form.attendees.length} selected)</label>
                  {employees.filter(e=>e.id!==user?.id).length===0 ? (
                    <div className="mt-1 p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 text-center">
                      No other team members in your company yet.
                      <Link to="/employees" className="ml-1 text-violet-600 hover:underline font-medium">Invite employees first</Link>
                    </div>
                  ) : (
                  <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {employees.filter(e=>e.id!==user?.id).map(emp=>(
                      <label key={emp.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <input type="checkbox" checked={form.attendees.includes(emp.id)} onChange={()=>toggleAttendee(emp.id)} className="accent-[#eab308]"/>
                        <span className="flex-1 truncate">{emp.first_name} {emp.last_name}</span>
                        <span className="text-xs text-zinc-400">{emp.employee_id}</span>
                      </label>
                    ))}
                  </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500">Creates a real Google Calendar event with an auto-generated Meet link; email invites are sent in background. Without server credentials a demo link is returned instead.</p>
                <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Scheduling…' : 'Schedule & Generate Meet Link'}</Button>
              </form>
            )}
            {!createdLink && msg && <div className="mt-3 text-sm p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">{msg}</div>}
          </Card>
        </div>
      )}

      <p className="text-xs text-zinc-400">Employees see only their meetings; admin/hr see all company meetings (<code>GET /meetings</code> role filter). Live detection via start/end window.</p>
    </div>
  )
}
