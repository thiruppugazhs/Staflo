import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import ThemeToggle from './ThemeToggle'
import Chatbot from './Chatbot'
import { useToast } from './ui/toast'
import { Users, Clock, CalendarDays, BarChart3, Settings, Menu, X, LogOut, User, Wallet, ChevronsLeft, ChevronsRight, FileText, Bell, Building2, Video, GraduationCap, LayoutDashboard } from 'lucide-react'

export default function Layout(){
  const { user, logout } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [showProfile, setShowProfile] = useState(false)
  const [today, setToday] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [settingStatus, setSettingStatus] = useState(false)

  const fetchToday = async()=> {
    try { const {data}=await api.get('/attendance/today'); setToday(data)} catch {}
  }
  const fetchNotifs = async()=>{ try{ const {data}=await api.get('/notifications'); setNotifs(data)}catch{}}
  useEffect(()=>{ fetchToday(); fetchNotifs() },[loc.pathname])

  const handleCheck = async(type:'in'|'out')=>{
    setChecking(true)
    try{
      const pos = await new Promise<GeolocationPosition>((res, rej)=>{
        if(!navigator.geolocation) return rej('no geo')
        navigator.geolocation.getCurrentPosition(res, rej, {timeout: 5000})
      }).catch(()=> null as any)
      const payload = pos ? {lat: pos.coords.latitude, lng: pos.coords.longitude} : {}
      if(type==='in'){ await api.post('/attendance/check-in', payload); toast.success(`Checked in at ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ✓`) }
      else { await api.post('/attendance/check-out', payload); toast.success(`Checked out at ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ✓`) }
      await fetchToday()
    } catch(e:any){ toast.error(e.response?.data?.detail || e.message || 'Failed')}
    finally{ setChecking(false)}
  }

  const handleSetStatus = async(status:string)=>{
    setSettingStatus(true)
    try{
      await api.post('/attendance/status', {status})
      toast.success(`Status set to ${status} ✓`)
      await fetchToday()
    } catch(e:any){ toast.error(e.response?.data?.detail || e.message || 'Failed')}
    finally{ setSettingStatus(false) }
  }

  const coreTabs = [
    {label:'Dashboard', path:'/dashboard', icon: LayoutDashboard, active: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md', tint: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'},
    {label:'Employees', path:'/employees', icon: Users, active: 'bg-[#004E72] text-white shadow-md shadow-[#004E72]/20', tint: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300', hover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300'},
    {label:'Attendance', path:'/attendance', icon: Clock, active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20', tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300'},
    {label:'Time Off', path:'/time-off', icon: CalendarDays, active: 'bg-amber-500 text-white shadow-md shadow-amber-500/20', tint: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300'},
    {label:'Payroll', path:'/payroll', icon: Wallet, active: 'bg-teal-600 text-white shadow-md shadow-teal-600/20', tint: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300', hover: 'hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-300'},
    {label:'Reports', path:'/reports', icon: BarChart3, active: 'bg-sky-600 text-white shadow-md shadow-sky-600/20', tint: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300', hover: 'hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-700 dark:hover:text-sky-300'},
    {label:'Documents', path:'/documents', icon: FileText, active: 'bg-orange-600 text-white shadow-md shadow-orange-600/20', tint: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300', hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-300'},
    {label:'Notifications', path:'/notifications', icon: Bell, active: 'bg-amber-600 text-white shadow-md shadow-amber-600/20', tint: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300'},
    {label:'Company', path:'/company', icon: Building2, active: 'bg-zinc-700 text-white shadow-md shadow-zinc-700/20', tint: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'},
    {label:'Meetings', path:'/meetings', icon: Video, active: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20', tint: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-300', hover: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:text-fuchsia-700 dark:hover:text-fuchsia-300'},
    {label:'Interns', path:'/interns', icon: GraduationCap, active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20', tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300'},
  ]
  const accountTabs = [
    {label:'My Profile', path:'/me', icon: User, active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20', tint: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300'},
    {label:'Settings', path:'/settings', icon: Settings, active: 'bg-zinc-800 text-white dark:bg-zinc-700 dark:text-white shadow-md', tint: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'},
  ]
  const tabs = [...coreTabs, ...accountTabs]

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(()=>{
    try { return localStorage.getItem('Staflo-sidebar-collapsed')==='1' } catch { return false }
  })
  useEffect(()=>{
    try { localStorage.setItem('Staflo-sidebar-collapsed', collapsed ? '1' : '0') } catch {}
  },[collapsed])

  const NavItem = ({t, onNavigate, collapsed: isCollapsed}:{t:any, onNavigate?:()=>void, collapsed?:boolean})=>{
    const active = loc.pathname===t.path
    const Icon = t.icon
    return (
      <Link
        key={t.path}
        to={t.path}
        onClick={onNavigate}
        title={isCollapsed ? t.label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isCollapsed ? 'justify-center px-2' : ''}
          ${active ? t.active : `text-zinc-600 dark:text-zinc-400 ${t.hover}`}`}
      >
        <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition ${active ? 'bg-white/20' : t.tint}`}>
          <Icon className="h-[16px] w-[16px] shrink-0" />
        </span>
        {!isCollapsed && t.label}
      </Link>
    )
  }

  const SidebarNav = ({ onNavigate, collapsed: isCollapsed = false }: { onNavigate?: () => void, collapsed?: boolean }) => (
    <nav className={`flex-1 px-3 py-4 space-y-4 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
      <div>
        {!isCollapsed && <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">Core</div>}
        <div className="space-y-1.5">
          {coreTabs.map(t=> <NavItem key={t.path} t={t} onNavigate={onNavigate} collapsed={isCollapsed} />)}
        </div>
      </div>
      <div>
        {!isCollapsed && <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">Account</div>}
        <div className="space-y-1.5">
          {accountTabs.map(t=> <NavItem key={t.path} t={t} onNavigate={onNavigate} collapsed={isCollapsed} />)}
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50/80 dark:from-zinc-900 dark:to-zinc-900 sticky top-0 h-screen transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <div className={`h-14 flex items-center border-b border-zinc-200 dark:border-zinc-800 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-3'}`}>
          <Link to="/dashboard" className={`flex items-center gap-2.5 font-bold text-lg tracking-tight ${collapsed ? 'justify-center' : ''}`}>
            <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#004E72] to-[#9B6B8A] flex items-center justify-center text-white shadow-sm shrink-0">
              <img src="/logo.svg" alt="Staflo logo" className="h-5 w-5 rounded-md brightness-0 invert" />
            </span>
            {!collapsed && <span className="bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Staflo</span>}
          </Link>
          <button
            onClick={()=>setCollapsed(v=>!v)}
            title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shrink-0"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4 text-zinc-600 dark:text-zinc-300" /> : <ChevronsLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />}
          </button>
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className={`p-3 border-t border-zinc-200 dark:border-zinc-800 ${collapsed ? 'px-2' : ''}`}>
          <Link to="/me" title={collapsed ? `${user?.first_name} ${user?.last_name} • ${user?.employee_id}` : undefined} className={`flex items-center gap-3 px-2 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-violet-300 dark:hover:border-zinc-600 transition ${collapsed ? 'justify-center px-1' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#004E72] to-[#9B6B8A] flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-violet-100 dark:ring-zinc-700">
              {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate leading-none">{user?.first_name} {user?.last_name}</div>
                <div className="text-xs text-zinc-500 truncate">{user?.employee_id} • <span className="capitalize text-violet-600 dark:text-violet-300">{user?.role}</span></div>
              </div>
            )}
          </Link>
          <button onClick={()=>{logout(); nav('/login')}} title={collapsed ? 'Log Out' : undefined} className={`mt-2 w-full flex items-center gap-2 px-2.5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${collapsed ? 'justify-center px-1' : ''}`}>
            <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-xl">
            <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800">
              <Link to="/dashboard" onClick={()=>setMobileOpen(false)} className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#004E72] to-[#9B6B8A] flex items-center justify-center text-white"><img src="/logo.svg" alt="Staflo logo" className="h-5 w-5 rounded-md brightness-0 invert" /></span> Staflo
              </Link>
              <button onClick={()=>setMobileOpen(false)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={()=>setMobileOpen(false)} />
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <Link to="/me" onClick={()=>setMobileOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#004E72] to-[#9B6B8A] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate leading-none">{user?.first_name} {user?.last_name}</div>
                  <div className="text-xs text-zinc-500 truncate">{user?.employee_id} • <span className="capitalize text-violet-600 dark:text-violet-300">{user?.role}</span></div>
                </div>
              </Link>
              <button onClick={()=>{logout(); nav('/login')}} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <div className="px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>setMobileOpen(true)} className="md:hidden h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Menu className="h-5 w-5" />
              </button>
              <span className="md:hidden font-bold flex items-center gap-2"><img src="/logo.svg" alt="Staflo logo" className="h-6 w-6 rounded" /> Staflo</span>
              <span className="hidden md:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tabs.find(t=>t.path===loc.pathname)?.label ?? 'Dashboard'}
              </span>
            </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="relative">
              <button onClick={()=>setShowNotifs(s=>!s)} className="relative h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs">🔔{notifs.length>0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white">{notifs.length}</span>}</button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-3 shadow-xl max-h-80 overflow-auto">
                  <div className="font-medium text-sm mb-2 flex items-center justify-between">Notifications & Email Alerts <Link to="/notifications" onClick={()=>setShowNotifs(false)} className="text-xs font-normal text-violet-600 dark:text-violet-400 hover:underline">View All →</Link></div>
                  {notifs.length===0 ? <div className="text-xs text-zinc-500">No alerts — invite/leave actions appear here (emails sent via Brevo SMTP)</div> :
                    notifs.map(n=>(
                      <div key={n.id} className="border-t border-zinc-200 dark:border-zinc-800 py-2">
                        <div className="text-xs font-medium">{n.title} <span className="text-zinc-500">• {new Date(n.created_at).toLocaleString()}</span></div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{n.message}</div>
                      </div>
                    ))}
                  <Link to="/notifications" onClick={()=>setShowNotifs(false)} className="mt-2 block text-center text-xs py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90">Open Notifications Page</Link>
                </div>
              )}
            </div>
            {!today?.checked_in ? (
              <Button size="sm" disabled={checking} onClick={()=>handleCheck('in')}>Check In</Button>
            ) : !today?.checked_out ? (
              <Button size="sm" variant="outline" disabled={checking} onClick={()=>handleCheck('out')}>Check Out</Button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                <span>{today?.working_hours ?? '-'}h</span>
                <select
                  value={today?.status ?? 'absent'}
                  disabled={settingStatus}
                  onChange={(e)=>handleSetStatus(e.target.value)}
                  title="Set status"
                  className="capitalize rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-400 transition disabled:opacity-50"
                >
                  <option value="present">Present</option>
                  <option value="break">Break</option>
                  <option value="absent">Absent</option>
                  {!['present','break','absent'].includes(today?.status) && <option value={today?.status}>{today?.status}</option>}
                </select>
              </div>
            )}
            <div className="relative">
              <button onClick={()=>setShowProfile(s=>!s)} className="relative h-8 w-8 rounded-full bg-[#004E72] flex items-center justify-center text-sm font-bold text-white">
                {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
                <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-[#0a0a0f] ${today?.status==='present' ? 'bg-green-500' : today?.status==='half_day' ? 'bg-amber-500' : today?.status==='leave' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-2 shadow-xl">
                  <div className="px-2 py-1 text-xs text-zinc-500">{user?.employee_id} • {user?.role}</div>
                  <div className="px-2 py-1 text-sm font-medium">{user?.first_name} {user?.last_name}</div>
                  <div className="px-2 text-xs text-zinc-500 truncate">{user?.email}</div>
                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800"/>
                  <Link to="/me" onClick={()=>setShowProfile(false)} className="block px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">My Profile</Link>
                  <Link to="/reports" onClick={()=>setShowProfile(false)} className="block px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">Reports</Link>
                  <button onClick={()=>{logout(); nav('/login')}} className="w-full text-left px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">Log Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {(user as any)?.email_verified===false && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs px-4 py-2 flex justify-between gap-4">
          <span>Email verification required — check your invite email or fetch token via API /auth/verify-token/{user?.id}</span>
          <button onClick={async()=>{ try{ const t=await api.get(`/auth/verify-token/${user?.id}`); await api.post('/auth/verify-email',{token:t.data.token}); toast.success('Email verified ✓'); window.location.reload() }catch(e:any){ toast.error(e.response?.data?.detail || 'Verification failed') }}} className="underline shrink-0">Verify Now (mock)</button>
        </div>
      )}
      <main className="w-full max-w-[1400px] mx-auto px-4 py-6 flex-1">
        <Outlet/>
      </main>
      {/* AI HR Chatbot — floats on all pages (Add ons.md Integration 2) */}
      <Chatbot/>
    </div>
  </div>
  )
}
