import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../stores/auth'
import {
  Users, Clock, CalendarDays, Wallet, TrendingUp,
  CheckCircle2, AlertTriangle, ArrowUpRight, Building2, Briefcase, Shield
} from 'lucide-react'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

type Employee = {
  id: string, employee_id: string, email: string, first_name: string, last_name: string,
  role: string, avatar_url?: string, department?: string, job_title?: string, phone?: string
}

export default function Dashboard(){
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats,setStats]=useState<any>(null)
  const [leaveQueue,setLeaveQueue]=useState<any[]>([])
  const [balances,setBalances]=useState<any>(null)
  const [pay,setPay]=useState<any>(null)
  const [week,setWeek]=useState<any>(null)
  const [todayMap,setTodayMap]=useState<Record<string,string>>({})
  const [myLeaves,setMyLeaves]=useState<any[]>([])

  const load = async()=>{
    try{
      const {data} = await api.get('/users')
      setEmployees(data)
    }catch{}
    try{ const r = await api.get('/reports/attendance'); setStats(r.data)}catch{}
    try{ const b = await api.get('/leave/balances'); setBalances(b.data)}catch{}
    try{
      const w = await api.get('/attendance/week')
      setWeek(w.data)
    }catch{}
    if(isAdmin){
      try{ const q = await api.get('/leave/queue'); setLeaveQueue(q.data)}catch{}
      try{ const p = await api.get('/reports/payroll'); setPay(p.data)}catch{}
      try{
        const b=await api.get('/attendance/today/batch')
        const m:Record<string,string>={}
        b.data.forEach((x:any)=> m[x.user_id]=x.status)
        setTodayMap(m)
      }catch{}
    } else {
      try{ const l=await api.get('/leave/my'); setMyLeaves(l.data)}catch{}
    }
  }
  useEffect(()=>{ load() },[])

  const deptStats = useMemo(()=>{
    const map: Record<string, number> = {}
    employees.forEach(e=>{ const d = e.department || 'Unassigned'; map[d]=(map[d]||0)+1 })
    const total = employees.length || 1
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count, pct: Math.round(count/total*100)}))
  },[employees])

  const roleStats = useMemo(()=>{
    const m:Record<string,number>={}
    employees.forEach(e=> m[e.role]=(m[e.role]||0)+1)
    return m
  },[employees])

  const pendingLeaves = leaveQueue.filter(l=>l.status==='pending').length
  const todayPresent = Object.values(todayMap).filter(s=>s==='present').length
  const todayAbsent = employees.length - todayPresent

  if(!isAdmin){
    // ===== EMPLOYEE DASHBOARD =====
    const avgHours = stats?.avg_hours ?? (week ? (week.total_hours/7).toFixed(1) : '—')
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.first_name} 👋</h1>
            <p className="text-sm text-zinc-500 mt-1">{new Date().toLocaleDateString('en-US',{weekday:'long', year:'numeric', month:'long', day:'numeric'})} • {user?.employee_id} • {user?.role}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/profile/${user?.id}`}><Button variant="outline" size="sm">View Profile</Button></Link>
            <Link to="/attendance"><Button size="sm">Mark Attendance <ArrowUpRight className="ml-1 h-4 w-4"/></Button></Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Clock className="h-5 w-5"/></div>
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{week?.payable_days ?? '—'}/7 days</span>
            </div>
            <div className="mt-3 text-2xl font-bold">{week?.total_hours ?? stats?.avg_hours ?? '—'}<span className="text-sm font-normal text-zinc-500">h total</span></div>
            <div className="text-xs text-zinc-500">This week • Avg {avgHours}h/day</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400"><CalendarDays className="h-5 w-5"/></div>
              <span className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> {balances?.paid_remaining ?? 24} left</span>
            </div>
            <div className="mt-3 text-2xl font-bold">{balances?.paid_remaining ?? 24}<span className="text-sm font-normal text-zinc-500"> / 24</span></div>
            <div className="text-xs text-zinc-500">Paid leave balance • Sick {balances?.sick_remaining ?? 7}d</div>
            <div className="mt-2 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{width: `${((balances?.paid_remaining ?? 24)/24)*100}%`}}/></div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400"><Wallet className="h-5 w-5"/></div>
              <Link to="/reports" className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">View slip <ArrowUpRight className="h-3 w-3"/></Link>
            </div>
            <div className="mt-3 text-sm font-medium">Next payroll</div>
            <div className="text-xs text-zinc-500"> attendance-based — payable {week?.payable_days ?? '—'}/7 this week</div>
            <div className="mt-2 text-xs px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 inline-flex gap-1 items-center"><AlertTriangle className="h-3 w-3"/> Complete attendance to maximize</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900"><Users className="h-5 w-5"/></div>
              <span className="text-xs text-zinc-500">Profile</span>
            </div>
            <div className="mt-3 font-medium truncate">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            <div className="text-xs text-zinc-500">{myLeaves.length} leave requests • {myLeaves.filter(l=>l.status==='pending').length} pending</div>
          </Card>
        </div>

        {/* Week + Leaves */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Weekly Attendance</h3>
              <span className="text-xs text-zinc-500">{week?.monday} → {week?.sunday}</span>
            </div>
            {week ? (
              <div className="mt-4">
                <div className="flex items-end gap-2 h-32">
                  {week.days.map((d:any)=>{
                    const h = d.working_hours ? Math.min(100, (d.working_hours/9)*100) : 8
                    const color = d.status==='present' ? 'bg-emerald-500' : d.status==='half_day' ? 'bg-amber-500' : d.status==='leave' ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex justify-center" style={{height:'96px'}}>
                          <div className={`absolute bottom-0 w-full rounded-t-lg ${color} transition-all`} style={{height: `${h}%`, minHeight: d.working_hours? '16px':'6px'}} title={`${d.working_hours ?? 0}h • ${d.status}`} />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{d.weekday.slice(0,2)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d.status==='present'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': d.status==='half_day'?'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': d.status==='leave'?'bg-sky-100 text-sky-700':'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{d.status==='half_day'?'½': d.status.slice(0,1).toUpperCase()}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-2"><div className="font-bold">{week.total_hours}h</div><div className="text-xs text-zinc-500">Total</div></div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-2"><div className="font-bold">{week.payable_days}</div><div className="text-xs text-zinc-500">Payable days</div></div>
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-2"><div className="font-bold">{(week.payable_days/7*100).toFixed(0)}%</div><div className="text-xs text-zinc-500">Attendance rate</div></div>
                </div>
              </div>
            ): <div className="text-sm text-zinc-500 mt-4">No week data — mark attendance daily.</div>}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">My Leaves</h3>
              <Link to="/time-off" className="text-xs text-violet-600 dark:text-violet-400">Manage →</Link>
            </div>
            <div className="mt-3 space-y-2 max-h-[260px] overflow-auto pr-1">
              {myLeaves.length===0 ? <div className="text-sm text-zinc-500">No requests yet. Apply from Time Off.</div> :
                myLeaves.slice(0,5).map(l=>(
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium capitalize">{l.type} • {l.days}d</div>
                      <div className="text-xs text-zinc-500">{l.start_date} → {l.end_date}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${l.status==='pending'?'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': l.status==='approved'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300':'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{l.status}</span>
                  </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/time-off"><Button variant="outline" className="w-full" size="sm">Calendar view</Button></Link>
              <Link to="/attendance"><Button className="w-full" size="sm">Attendance</Button></Link>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Link to={`/profile/${user?.id}`} className="block"><Card className="p-5 hover:border-violet-300 dark:hover:border-violet-700 transition text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">👤</div><div className="mt-2 font-medium">My Profile</div><div className="text-xs text-zinc-500">Salary & documents</div></Card></Link>
          <Link to="/attendance" className="block"><Card className="p-5 hover:border-emerald-300 transition text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">⏰</div><div className="mt-2 font-medium">Attendance</div><div className="text-xs text-zinc-500">{stats ? `${stats.present} present` : 'Daily/weekly'}</div></Card></Link>
          <Link to="/time-off" className="block"><Card className="p-5 hover:border-sky-300 transition text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">🗓️</div><div className="mt-2 font-medium">Leave Requests</div><div className="text-xs text-zinc-500">Paid/Sick/Unpaid</div></Card></Link>
          <Link to="/reports" className="block"><Card className="p-5 hover:border-amber-300 transition text-center"><div className="mx-auto h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">💰</div><div className="mt-2 font-medium">My Payslip</div><div className="text-xs text-zinc-500">Print-ready</div></Card></Link>
        </div>
      </div>
    )
  }

  // ===== ADMIN / HR DASHBOARD =====
  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Company overview • {employees.length} employees • {todayPresent} present today • {pendingLeaves} pending leaves</p>
        </div>
        <Link to="/employees" className="shrink-0"><Button variant="outline" className="gap-2"><Users className="h-4 w-4"/> All Employees</Button></Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-20 w-20 bg-violet-500/10 rounded-full -mr-8 -mt-8"/>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white"><Users className="h-5 w-5"/></div>
            <span className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full ${employees.length>0?'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300':'bg-zinc-100 dark:bg-zinc-800'}`}><TrendingUp className="h-3 w-3"/> {roleStats.admin||0} admins</span>
          </div>
          <div className="mt-4 text-3xl font-bold">{employees.length}</div>
          <div className="text-xs text-zinc-500">Total employees</div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3"/> {roleStats.admin||0} Admin</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3"/> {roleStats.hr||0} HR</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {roleStats.employee||0} Emp</span>
          </div>
        </Card>
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-20 w-20 bg-emerald-500/10 rounded-full -mr-8 -mt-8"/>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="h-5 w-5"/></div>
            <span className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">{todayPresent} / {employees.length} <ArrowUpRight className="h-3 w-3"/></span>
          </div>
          <div className="mt-4 text-3xl font-bold">{stats ? `${stats.present}` : todayPresent}<span className="text-lg font-normal text-zinc-400"> present</span></div>
          <div className="text-xs text-zinc-500">Avg {stats?.avg_hours ?? '—'}h • {stats?.half_day ?? 0} half-days • {stats?.absent ?? todayAbsent} absent</div>
          <div className="mt-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500" style={{width:`${employees.length? todayPresent/employees.length*100:0}%`}}/>
            <div className="bg-amber-400" style={{width:`${employees.length? (stats?.half_day||0)/employees.length*100:0}%`}}/>
          </div>
        </Card>
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-20 w-20 bg-amber-500/10 rounded-full -mr-8 -mt-8"/>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-white"><CalendarDays className="h-5 w-5"/></div>
            <span className={`text-xs px-2 py-1 rounded-full ${pendingLeaves?'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300':'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{pendingLeaves} pending</span>
          </div>
          <div className="mt-4 text-3xl font-bold">{leaveQueue.length}<span className="text-lg font-normal text-zinc-400"> requests</span></div>
          <div className="text-xs text-zinc-500">{pendingLeaves} pending • {leaveQueue.filter(l=>l.status==='approved').length} approved • {leaveQueue.filter(l=>l.status==='rejected').length} rejected</div>
          <Link to="/time-off" className="mt-3 inline-flex text-xs text-amber-600 dark:text-amber-400 hover:underline">Review queue →</Link>
        </Card>
        <Card className="p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-20 w-20 bg-sky-500/10 rounded-full -mr-8 -mt-8"/>
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center text-white"><Wallet className="h-5 w-5"/></div>
            <span className="text-xs flex items-center gap-1 text-zinc-500"><Building2 className="h-3 w-3"/> {pay?.salary_structures ?? 0} structures</span>
          </div>
          <div className="mt-4 text-3xl font-bold">₹{pay ? (pay.total_monthly_payroll/1000).toFixed(0)+'k' : '—'}</div>
          <div className="text-xs text-zinc-500">Monthly payroll • Avg ₹{pay?.avg_salary ?? '—'} • {pay?.employees ?? employees.length} staff</div>
          <Link to="/reports" className="mt-3 inline-flex text-xs text-sky-600 dark:text-sky-400 hover:underline">Payroll details →</Link>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Attendance overview */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Attendance Overview</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{stats?.period ?? 'All time'} • {stats?.total_records ?? 0} records</span>
          </div>
          {stats ? (
            <>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  {label:'Present', val:stats.present, color:'bg-emerald-500', text:'text-emerald-600'},
                  {label:'Half-day', val:stats.half_day, color:'bg-amber-500', text:'text-amber-600'},
                  {label:'Absent', val:stats.absent, color:'bg-red-500', text:'text-red-600'},
                  {label:'Leave', val:stats.leave, color:'bg-sky-500', text:'text-sky-600'},
                ].map(s=>(
                  <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-center">
                    <div className={`mx-auto h-2 w-8 rounded-full ${s.color} mb-2`}/>
                    <div className="text-xl font-bold">{s.val}</div>
                    <div className={`text-xs ${s.text}`}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  {label:'Present', v:stats.present, c:'bg-emerald-500'},
                  {label:'Half-day', v:stats.half_day, c:'bg-amber-500'},
                  {label:'Absent', v:stats.absent, c:'bg-red-500'},
                  {label:'Leave', v:stats.leave, c:'bg-sky-500'},
                ].map(row=>{
                  const total = stats.total_records || 1
                  const pct = Math.round(row.v/total*100)
                  return (
                    <div key={row.label} className="flex items-center gap-3 text-sm">
                      <span className="w-16 text-xs text-zinc-500">{row.label}</span>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${row.c}`} style={{width:`${pct}%`}}/>
                      </div>
                      <span className="w-10 text-right text-xs font-medium">{pct}%</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/attendance" className="flex-1"><Button variant="outline" size="sm" className="w-full">Day view</Button></Link>
                <Link to="/attendance" className="flex-1"><Button variant="outline" size="sm" className="w-full">Week view</Button></Link>
              </div>
            </>
          ): <div className="text-sm text-zinc-500 mt-6">No attendance data yet.</div>}
        </Card>

        {/* Leave queue preview */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Leave Queue</h3>
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">{pendingLeaves} pending</span>
          </div>
          <div className="mt-4 space-y-2 flex-1">
            {leaveQueue.length===0 ? <div className="text-sm text-zinc-500 py-8 text-center">No leave requests</div> :
              leaveQueue.slice(0,4).map(q=>(
                <div key={q.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                    {q.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{q.name}</div>
                    <div className="text-xs text-zinc-500 truncate capitalize">{q.type} • {q.days}d • {q.start_date} → {q.end_date}</div>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full font-medium shrink-0 ${q.status==='pending'?'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300': q.status==='approved'?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{q.status}</span>
                </div>
              ))}
          </div>
          <Link to="/time-off" className="mt-4"><Button variant="outline" size="sm" className="w-full">Open Time Off →</Button></Link>
        </Card>
      </div>

      {/* Dept + Payroll + Recent */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4"/> Departments</h3>
          <div className="mt-4 space-y-3">
            {deptStats.length===0 ? <div className="text-sm text-zinc-500">No departments yet</div> :
              deptStats.map(d=>(
                <div key={d.name}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate pr-2">{d.name}</span>
                    <span className="text-zinc-500 text-xs">{d.count} • {d.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{width:`${d.pct}%`}}/>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 text-xs text-zinc-500">
            Total {employees.length} across {deptStats.length} departments
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4"/> Payroll Snapshot</h3>
          {pay ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-600 to-sky-500 text-white p-4">
                <div className="text-xs opacity-80">Total Monthly</div>
                <div className="text-2xl font-bold">₹{pay.total_monthly_payroll.toLocaleString()}</div>
                <div className="text-xs opacity-80 mt-1">{pay.employees} employees • {pay.salary_structures} structures</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-600"><TrendingUp className="h-3 w-3"/> Avg</div>
                  <div className="font-bold">₹{pay.avg_salary}</div>
                  <div className="text-xs text-zinc-500">per employee</div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-sky-600"><CalendarDays className="h-3 w-3"/> Yearly est.</div>
                  <div className="font-bold">₹{(pay.total_monthly_payroll*12/100000).toFixed(1)}L</div>
                  <div className="text-xs text-zinc-500">annual payroll</div>
                </div>
              </div>
              <Link to="/reports"><Button size="sm" variant="outline" className="w-full">View salary slips →</Button></Link>
            </div>
          ): <div className="text-sm text-zinc-500 mt-4">No payroll data</div>}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Today • Live Status</h3>
          <p className="text-xs text-zinc-500">Green = present • Amber = half-day • Red = absent • Yellow = leave</p>
          <div className="mt-4 space-y-2 max-h-[220px] overflow-auto pr-1">
            {employees.slice(0,6).map(emp=>{
              const st=todayMap[emp.id]||'absent'
              const color=st==='present'?'bg-emerald-500':st==='half_day'?'bg-amber-500':st==='leave'?'bg-yellow-500':'bg-red-500'
              return (
                <Link key={emp.id} to={`/profile/${emp.id}`} className="flex items-center gap-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 p-2 transition">
                  <div className="relative h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                    {emp.avatar_url ? <img src={resolveFileUrl(emp.avatar_url)} className="h-full w-full object-cover"/> : `${emp.first_name[0]}${emp.last_name[0]}`}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{emp.first_name} {emp.last_name}</div>
                    <div className="text-xs text-zinc-500 truncate">{emp.employee_id} • {emp.department || '—'}</div>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full capitalize ${st==='present'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': st==='half_day'?'bg-amber-100 text-amber-700':'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{st.replace('_',' ')}</span>
                </Link>
              )
            })}
          </div>
          {employees.length>6 && <Link to="/employees" className="mt-3 block text-center text-xs text-violet-600 dark:text-violet-400 hover:underline">{employees.length-6} more employees →</Link>}
        </Card>
      </div>
    </div>
  )
}
