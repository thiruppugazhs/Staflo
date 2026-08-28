import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useAuth } from '../stores/auth'
import { UserX, Calendar, Phone, Mail, MessageSquare, AlertCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Attendance(){
  const { user } = useAuth()
  const [rows,setRows]=useState<any[]>([])
  const [from,setFrom]=useState('')
  const [to,setTo]=useState('')
  const [filterUser,setFilterUser]=useState('')
  const [view,setView]=useState<'day'|'week'|'absent'>('day')
  const [weekData,setWeekData]=useState<any>(null)
  const [absentees, setAbsentees] = useState<any[]>([])
  const [absentDate, setAbsentDate] = useState(new Date().toISOString().slice(0, 10))
  const [absentLoading, setAbsentLoading] = useState(false)

  const load = async()=>{
    const params:any={}
    if(from) params.date_from = from
    if(to) params.date_to = to
    if(filterUser) params.user_id = filterUser
    else if(user?.role==='employee') params.user_id = user.id
    const {data}=await api.get('/attendance', {params})
    setRows(data)
  }

  const loadWeek = async()=>{
    const params:any={}
    if(from) params.start = from
    if(filterUser) params.user_id = filterUser
    else if(user?.role==='employee') params.user_id = user.id
    try{
      const {data}=await api.get('/attendance/week', {params})
      setWeekData(data)
    }catch{}
  }

  const loadAbsentees = async()=>{
    setAbsentLoading(true)
    try {
      const { data } = await api.get('/attendance/absentees', { params: { target_date: absentDate } })
      setAbsentees(data.absentees || [])
    } catch {
      setAbsentees([])
    } finally {
      setAbsentLoading(false)
    }
  }

  const [todayStatus, setTodayStatus] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayStatus = async() => {
    try {
      const { data } = await api.get('/attendance/today')
      setTodayStatus(data)
    } catch {}
  }

  const handlePunch = async (type: 'in' | 'out') => {
    setChecking(true)
    try {
      let payload: any = {}
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2000, enableHighAccuracy: false })
          })
          if (pos && pos.coords) {
            payload = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          }
        }
      } catch {}

      if (type === 'in') {
        await api.post('/attendance/check-in', payload)
      } else {
        await api.post('/attendance/check-out', payload)
      }
      await fetchTodayStatus()
      if (view === 'day') load()
      else if (view === 'week') loadWeek()
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message || 'Action failed')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    fetchTodayStatus()
  }, [])

  useEffect(()=>{
    if(view==='day') load()
    else if(view==='week') loadWeek()
    else if(view==='absent') loadAbsentees()
  },[view, absentDate])

  useEffect(()=>{ if(view==='week') loadWeek() },[from, filterUser])

  const display = rows

  return (
    <div className="space-y-4">
      {/* Punch In / Out Card */}
      <Card className="p-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-xs">
              <Clock className="h-6 w-6"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-900 dark:text-white">Live Attendance Punch</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{currentTime}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {todayStatus?.checked_in ? (
                  todayStatus?.checked_out ? (
                    <>Checked out for today • Worked <b>{todayStatus.working_hours ?? '—'}h</b></>
                  ) : (
                    <>Checked in at <b>{todayStatus.check_in ? new Date(todayStatus.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</b></>
                  )
                ) : (
                  <>Not checked in yet today</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!todayStatus?.checked_in ? (
              <Button
                disabled={checking}
                onClick={() => handlePunch('in')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 font-semibold"
              >
                {checking ? 'Checking In…' : '✓ Check In Now'}
              </Button>
            ) : !todayStatus?.checked_out ? (
              <Button
                disabled={checking}
                variant="outline"
                onClick={() => handlePunch('out')}
                className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-9 px-5 font-semibold"
              >
                {checking ? 'Checking Out…' : 'Check Out'}
              </Button>
            ) : (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                ✓ Shift Completed ({todayStatus?.working_hours ?? '—'}h)
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance & Absenteeism</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Daily time logs, weekly payroll hours & absent employee roster</p>
        </div>
      </div>

      <Card className="p-3.5 flex flex-wrap gap-2.5 items-end">
        <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
          <Button size="sm" variant={view==='day'?'default':'ghost'} onClick={()=>setView('day')} className="h-8 text-xs">Day Logs</Button>
          <Button size="sm" variant={view==='week'?'default':'ghost'} onClick={()=>setView('week')} className="h-8 text-xs">Week View</Button>
          {(user?.role==='admin'||user?.role==='hr') && (
            <Button size="sm" variant={view==='absent'?'default':'ghost'} onClick={()=>setView('absent')} className="h-8 text-xs gap-1.5">
              <UserX className="h-3.5 w-3.5 text-red-500"/> Absent List
            </Button>
          )}
        </div>

        {view !== 'absent' ? (
          <>
            <div><label className="text-[11px] font-semibold text-zinc-500 block">From Date</label><Input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="h-8 text-xs"/></div>
            <div><label className="text-[11px] font-semibold text-zinc-500 block">To Date</label><Input type="date" value={to} onChange={e=>setTo(e.target.value)} className="h-8 text-xs"/></div>
            {(user?.role==='admin'||user?.role==='hr') && <div><label className="text-[11px] font-semibold text-zinc-500 block">User Filter</label><Input placeholder="User ID" value={filterUser} onChange={e=>setFilterUser(e.target.value)} className="h-8 text-xs"/></div>}
            <Button size="sm" onClick={()=> view==='day'?load():loadWeek()} className="h-8 text-xs bg-[#004E72] hover:bg-[#092634] text-white">Filter</Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block">Select Date</label>
              <Input type="date" value={absentDate} onChange={e=>setAbsentDate(e.target.value)} className="h-8 text-xs"/>
            </div>
            <Button size="sm" onClick={loadAbsentees} className="h-8 text-xs mt-4 bg-[#004E72] text-white">Refresh List</Button>
          </div>
        )}

        <div className="ml-auto text-xs text-zinc-500 font-medium self-center">
          {view==='week' && weekData ? `Week ${weekData.monday} → ${weekData.sunday}` : view==='absent' ? `${absentees.length} Absent Employees` : `${display.length} records`}
        </div>
      </Card>

      {/* Absent Employees Roster View */}
      {view==='absent' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>Showing employees absent or on leave for <b>{absentDate}</b></span>
            <span className="text-red-600 font-semibold">{absentees.length} not present</span>
          </div>

          {absentees.length === 0 ? (
            <Card className="p-8 text-center text-zinc-500 space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600">✓</div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Full Attendance!</h3>
              <p className="text-xs text-zinc-400">All registered employees are marked present or checked in for this date.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {absentees.map(emp => (
                <Card key={emp.user_id} className="p-4 border-l-4 border-l-red-500 space-y-3 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {emp.name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">{emp.employee_id} • {emp.department}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.is_on_leave ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'}`}>
                      {emp.is_on_leave ? `On Leave (${emp.leave_type})` : 'Absent'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                    <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-zinc-400"/> {emp.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-zinc-400"/> {emp.phone}</div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {emp.phone && emp.phone !== '—' && (
                      <a href={`tel:${emp.phone}`} className="flex-1 text-center py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium transition flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3"/> Call
                      </a>
                    )}
                    <a href={`mailto:${emp.email}?subject=Attendance%20Follow-up%20for%20${absentDate}`} className="flex-1 text-center py-1.5 rounded-md bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[11px] font-medium transition flex items-center justify-center gap-1">
                      <Mail className="h-3 w-3"/> Email
                    </a>
                    <Link to={`/profile/${emp.user_id}`} className="px-2 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 text-[11px] font-medium">
                      Profile →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {view==='week' && weekData && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm">Week ISO {weekData.monday} → {weekData.sunday} — Total {weekData.total_hours}h • Payable {weekData.payable_days}/7 days</h3>
          <div className="grid grid-cols-7 gap-2 mt-3 text-xs">
            {weekData.days.map((d:any)=>(
              <div key={d.date} className={`border rounded p-2 text-center ${d.status==='present'?'border-green-800 bg-green-950/30':d.status==='half_day'?'border-amber-800 bg-amber-950/30':d.status==='leave'?'border-yellow-800 bg-yellow-950/30':'border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30'}`}>
                <div className="font-medium">{d.weekday}</div>
                <div className="text-[11px] text-zinc-400">{d.date.slice(5)}</div>
                <div className="mt-1 text-[10px]">{d.check_in ? new Date(d.check_in).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'} → {d.check_out ? new Date(d.check_out).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</div>
                <div className="text-[10px]">{d.working_hours ?? '—'}h</div>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] ${d.status==='present'?'bg-green-900 text-green-200':d.status==='half_day'?'bg-amber-900 text-amber-200':d.status==='leave'?'bg-yellow-900 text-yellow-200':'bg-red-900 text-red-200'}`}>{d.status}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-zinc-500 mt-2">Half-day counts as 0.5 payable day for payroll. Use Day view for date range filters.</div>
        </Card>
      )}

      {view==='day' && (
        <Card className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">User</th><th className="text-left p-3">Check In</th><th className="text-left p-3">Check Out</th><th className="text-left p-3">Work Hours</th><th className="text-left p-3">Status</th><th className="text-left p-3">Location</th></tr></thead>
            <tbody>
              {display.map(r=>(
                <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3">{r.date}</td>
                  <td className="p-3 text-xs font-mono">{r.user_id.slice(0,8)}</td>
                  <td className="p-3 text-xs">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}</td>
                  <td className="p-3 text-xs">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : '—'}</td>
                  <td className="p-3">{r.working_hours ?? '—'}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${r.status==='present'?'bg-green-900 text-green-200': r.status==='half_day'?'bg-amber-900 text-amber-200': r.status==='leave'?'bg-yellow-900 text-yellow-200':'bg-red-900 text-red-200'}`}>{r.status}</span></td>
                  <td className="p-3 text-xs">{r.location_in ? `${r.location_in.lat?.toFixed(2)},${r.location_in.lng?.toFixed(2)}` : 'IP only'}</td>
                </tr>
              ))}
              {display.length===0 && <tr><td colSpan={7} className="p-6 text-center text-zinc-500">No attendance yet — use Check In / Check Out in header (geolocation captured)</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
