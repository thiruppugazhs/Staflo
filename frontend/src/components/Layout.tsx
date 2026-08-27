import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import ThemeToggle from './ThemeToggle'
import Chatbot from './Chatbot'
import { useToast } from './ui/toast'
import { Users, Clock, CalendarDays, BarChart3, Settings, Menu, X, LogOut, User, Wallet, ChevronLeft, ChevronRight, FileText, Bell, Building2, Video, GraduationCap, LayoutDashboard, CheckCircle2 } from 'lucide-react'

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
    {label:'Dashboard', path:'/dashboard', icon: LayoutDashboard},
    {label:'Employees', path:'/employees', icon: Users},
    {label:'Attendance', path:'/attendance', icon: Clock},
    {label:'Time Off', path:'/time-off', icon: CalendarDays},
    {label:'Payroll', path:'/payroll', icon: Wallet},
    {label:'Reports', path:'/reports', icon: BarChart3},
    {label:'Documents', path:'/documents', icon: FileText},
    {label:'Notifications', path:'/notifications', icon: Bell},
    {label:'Company', path:'/company', icon: Building2},
    {label:'Meetings', path:'/meetings', icon: Video},
    {label:'Interns', path:'/interns', icon: GraduationCap},
  ]
  const accountTabs = [
    {label:'My Profile', path:'/me', icon: User},
    {label:'Settings', path:'/settings', icon: Settings},
  ]
  const tabs = [...coreTabs, ...accountTabs]

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(()=>{
    try { return localStorage.getItem('dailyflow-sidebar-collapsed')==='1' } catch { return false }
  })
  useEffect(()=>{
    try { localStorage.setItem('dailyflow-sidebar-collapsed', collapsed ? '1' : '0') } catch {}
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all
          ${isCollapsed ? 'justify-center px-2' : ''}
          ${active
            ? 'bg-amber-400 text-stone-950 shadow-xs'
            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'}`}
      >
        <span className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition ${active ? 'bg-stone-950/10 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
          <Icon className="h-4 w-4 shrink-0" />
        </span>
        {!isCollapsed && <span className="truncate">{t.label}</span>}
      </Link>
    )
  }

  const SidebarNav = ({ onNavigate, collapsed: isCollapsed = false }: { onNavigate?: () => void, collapsed?: boolean }) => (
    <nav className={`flex-1 px-3 py-4 space-y-4 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
      <div>
        {!isCollapsed && <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">Workforce</div>}
        <div className="space-y-1">
          {coreTabs.map(t=> <NavItem key={t.path} t={t} onNavigate={onNavigate} collapsed={isCollapsed} />)}
        </div>
      </div>
      <div>
        {!isCollapsed && <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">Personal & System</div>}
        <div className="space-y-1">
          {accountTabs.map(t=> <NavItem key={t.path} t={t} onNavigate={onNavigate} collapsed={isCollapsed} />)}
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#fcfbf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex font-sans">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex shrink-0 flex-col border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 h-screen transition-all duration-200 select-none z-30 ${collapsed ? 'w-20' : 'w-60'}`}>
        <div className={`h-16 flex items-center border-b border-stone-100 dark:border-stone-800/80 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-4'}`}>
          <Link to="/dashboard" className={`flex items-center gap-2 font-black text-lg tracking-tight ${collapsed ? 'justify-center' : ''}`}>
            <span className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs shrink-0 text-sm">
              DF
            </span>
            {!collapsed && (
              <span className="text-stone-900 dark:text-white font-extrabold tracking-tight">
                Daily<span className="text-amber-500 font-black">Flow</span>
              </span>
            )}
          </Link>
          <button
            onClick={()=>setCollapsed(v=>!v)}
            title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 transition cursor-pointer shrink-0 shadow-2xs"
          >
            {collapsed ? <ChevronRight className="h-4 w-4 text-stone-600 dark:text-stone-300" /> : <ChevronLeft className="h-4 w-4 text-stone-600 dark:text-stone-300" />}
          </button>
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className={`p-3 border-t border-stone-100 dark:border-stone-800 ${collapsed ? 'px-2' : ''}`}>
          <Link to="/me" title={collapsed ? `${user?.first_name} ${user?.last_name} • ${user?.employee_id}` : undefined} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 shadow-2xs hover:border-amber-400 transition ${collapsed ? 'justify-center px-1' : ''}`}>
            <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-bold text-stone-950 shrink-0 shadow-2xs">
              {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate leading-tight text-stone-900 dark:text-white">{user?.first_name} {user?.last_name}</div>
                <div className="text-[10px] text-stone-400 truncate mt-0.5">{user?.employee_id} • <span className="capitalize text-amber-600 dark:text-amber-400 font-semibold">{user?.role}</span></div>
              </div>
            )}
          </Link>
          <button onClick={()=>{logout(); nav('/login')}} title={collapsed ? 'Log Out' : undefined} className={`mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition cursor-pointer ${collapsed ? 'justify-center px-1' : ''}`}>
            <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs" onClick={()=>setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-stone-100 dark:border-stone-800">
              <Link to="/dashboard" onClick={()=>setMobileOpen(false)} className="flex items-center gap-2 font-extrabold text-base tracking-tight">
                <span className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black">DF</span>
                <span>Daily<span className="text-amber-500 font-black">Flow</span></span>
              </Link>
              <button onClick={()=>setMobileOpen(false)} className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav onNavigate={()=>setMobileOpen(false)} />
            <div className="p-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <Link to="/me" onClick={()=>setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs">
                <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-bold text-stone-950 shrink-0">
                  {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate leading-tight">{user?.first_name} {user?.last_name}</div>
                  <div className="text-[10px] text-stone-400 truncate">{user?.employee_id} • <span className="capitalize text-amber-600 dark:text-amber-400 font-semibold">{user?.role}</span></div>
                </div>
              </Link>
              <button onClick={()=>{logout(); nav('/login')}} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 rounded-full border border-rose-200 hover:bg-rose-50 cursor-pointer">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b bg-white/90 dark:bg-stone-900/90 backdrop-blur border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>setMobileOpen(true)} className="md:hidden p-2 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                <Menu className="h-4 w-4" />
              </button>
              <span className="md:hidden font-extrabold flex items-center gap-1.5 text-sm">
                Daily<span className="text-amber-500 font-black">Flow</span>
              </span>
              <span className="hidden md:block text-sm font-bold text-stone-800 dark:text-stone-200">
                {tabs.find(t=>t.path===loc.pathname)?.label ?? 'Dashboard'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {/* Attendance Quick Punch Widget */}
              <div className="flex items-center">
                {!today?.checked_in ? (
                  <Button size="sm" disabled={checking} onClick={()=>handleCheck('in')} className="flex items-center gap-1.5 font-bold shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{checking ? 'Punching…' : 'Punch In'}</span>
                  </Button>
                ) : !today?.checked_out ? (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 pl-3 pr-1 py-1 rounded-xl">
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      In: <b className="font-mono font-bold">{today.check_in_time || 'Logged'}</b>
                    </span>
                    <button
                      onClick={()=>handleCheck('out')}
                      disabled={checking}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 transition cursor-pointer"
                    >
                      {checking ? '…' : 'Punch Out'}
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Logged ({today?.working_hours ?? '-'}h)</span>
                  </div>
                )}
              </div>

              {/* Notifications Popover */}
              <div className="relative">
                <button onClick={()=>setShowNotifs(s=>!s)} className="relative h-9 w-9 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer transition">
                  <Bell className="h-4 w-4" />
                  {notifs.length>0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-stone-950 font-black text-[9px] flex items-center justify-center shadow-xs">{notifs.length}</span>}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 p-3 shadow-xl max-h-80 overflow-auto z-50">
                    <div className="font-bold text-xs mb-2 flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                      <span>Notifications & Alerts</span>
                      <Link to="/notifications" onClick={()=>setShowNotifs(false)} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">View All →</Link>
                    </div>
                    {notifs.length===0 ? <div className="text-xs text-stone-400 py-4 text-center">No unread alerts</div> :
                      notifs.map(n=>(
                        <div key={n.id} className="border-t border-stone-100 dark:border-stone-800 py-2">
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{n.title} <span className="text-stone-400 font-normal text-[10px]">• {new Date(n.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                          <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{n.message}</div>
                        </div>
                      ))}
                    <Link to="/notifications" onClick={()=>setShowNotifs(false)} className="mt-2 block text-center text-xs font-bold py-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-600 transition">Open Notifications Page</Link>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="relative">
                <button onClick={()=>setShowProfile(s=>!s)} className="relative h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-bold text-stone-950 cursor-pointer shadow-2xs">
                  {(user?.first_name?.[0]||'U')}{(user?.last_name?.[0]||'')}
                  <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-stone-900 ${today?.status==='present' ? 'bg-emerald-500' : today?.status==='half_day' ? 'bg-amber-500' : today?.status==='leave' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 p-2 shadow-xl z-50">
                    <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">{user?.first_name} {user?.last_name}</div>
                      <div className="text-[11px] text-stone-400 truncate mt-0.5">{user?.email}</div>
                      <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                        {user?.role} • {user?.employee_id}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link to="/me" onClick={()=>setShowProfile(false)} className="block px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition">My Profile</Link>
                      <Link to="/reports" onClick={()=>setShowProfile(false)} className="block px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition">Reports & Slips</Link>
                    </div>
                    <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button onClick={()=>{logout(); nav('/login')}} className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer">Log Out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {(user as any)?.email_verified===false && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs px-4 sm:px-6 py-2 flex justify-between gap-4 items-center">
            <span>Email verification notice — check your welcome email or verify credentials via the invite flow.</span>
            <button onClick={async()=>{ try{ const t=await api.get(`/auth/verify-token/${user?.id}`); await api.post('/auth/verify-email',{token:t.data.token}); toast.success('Email verified ✓'); window.location.reload() }catch(e:any){ toast.error(e.response?.data?.detail || 'Verification failed') }}} className="underline shrink-0 font-bold cursor-pointer">Verify Now</button>
          </div>
        )}

        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex-1">
          <Outlet/>
        </main>
        <Chatbot/>
      </div>
    </div>
  )
}

