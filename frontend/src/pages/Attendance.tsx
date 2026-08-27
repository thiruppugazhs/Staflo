import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useAuth } from '../stores/auth'

export default function Attendance(){
  const { user } = useAuth()
  const [rows,setRows]=useState<any[]>([])
  const [from,setFrom]=useState('')
  const [to,setTo]=useState('')
  const [filterUser,setFilterUser]=useState('')
  const [view,setView]=useState<'day'|'week'>('day')
  const [weekData,setWeekData]=useState<any>(null)

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
  useEffect(()=>{ if(view==='day') load(); else loadWeek() },[view])
  useEffect(()=>{ if(view==='week') loadWeek() },[from, filterUser])

  const display = rows

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Attendance — List View (Admin/HR vs Employee)</h1>
      <p className="text-xs text-zinc-500">Daily and weekly views • check-in/out • status: Present/Absent/Half-day/Leave (spec 3.4). Employees own only, admin all. Attendance as basis for payroll.</p>
      <Card className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex gap-2">
          <Button size="sm" variant={view==='day'?'default':'outline'} onClick={()=>setView('day')}>Day View</Button>
          <Button size="sm" variant={view==='week'?'default':'outline'} onClick={()=>setView('week')}>Week View (ISO Mon-Sun)</Button>
        </div>
        <div><label className="text-xs text-zinc-500">From</label><Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label className="text-xs text-zinc-500">To (day view)</label><Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        {(user?.role==='admin'||user?.role==='hr') && <div><label className="text-xs text-zinc-500">User ID (blank = all)</label><Input placeholder="Filter user" value={filterUser} onChange={e=>setFilterUser(e.target.value)}/></div>}
        <Button onClick={()=> view==='day'?load():loadWeek()}>Filter</Button>
        <div className="ml-auto text-xs text-zinc-500">{view==='week' && weekData ? `Week ${weekData.monday} → ${weekData.sunday}` : `${display.length} records`}</div>
      </Card>

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
          <div className="text-xs text-zinc-500 mt-2">Half-day counts as 0.5 payable day for payroll (spec 3.4 note). Use Day view for date range filters.</div>
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
