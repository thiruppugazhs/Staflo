import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Clock, CalendarCheck, Wallet, Users, ShieldCheck, Bell,
  ArrowRight, Check, Sparkles, Building2, UserPlus, BarChart3,
  MapPin, Timer, FileText, Layers, TrendingUp, Lock, Globe, Zap, Menu, X, ChevronRight
} from 'lucide-react'
import { useAuth } from '../stores/auth'

export default function Landing() {
  const { token } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 selection:bg-amber-500/20 font-sans">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs text-sm">
                DF
              </span>
              <span className="font-extrabold text-[19px] tracking-tight text-stone-900">
                Daily<span className="text-amber-500 font-black">Flow</span>
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
              <a href="#features" className="px-3 py-2 text-stone-600 hover:text-stone-900 transition">Features</a>
              <a href="#how-it-works" className="px-3 py-2 text-stone-600 hover:text-stone-900 transition">How it works</a>
              <a href="#roles" className="px-3 py-2 text-stone-600 hover:text-stone-900 transition">For Teams</a>
              <a href="#pricing" className="px-3 py-2 text-stone-600 hover:text-stone-900 transition">Pricing</a>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {token ? (
              <Link to="/dashboard">
                <button className="inline-flex items-center justify-center rounded-xl h-9 px-5 text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-xs transition cursor-pointer">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2">Sign In</Link>
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center rounded-xl h-9 px-5 text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-xs transition cursor-pointer">
                    Create Company <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                </Link>
              </>
            )}
          </div>

          <button className="lg:hidden h-9 w-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-700" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-xs font-semibold text-stone-700">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block py-2 text-xs font-semibold text-stone-700">How it works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-xs font-semibold text-stone-700">Pricing</a>
            <div className="pt-3 flex flex-col gap-2">
              {token ? <Link to="/dashboard" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-xl h-10 px-4 text-xs font-bold bg-amber-500 text-stone-950">Go to Dashboard</button></Link>
                : <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-xl h-10 px-4 text-xs font-medium border border-stone-200 bg-white text-stone-800">Sign In</button></Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-xl h-10 px-4 text-xs font-bold bg-amber-500 text-stone-950">Create Company</button></Link>
                </>}
            </div>
          </div>
        )}
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-[#fcfbf9]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[#fcfbf9]" />
          <div className="absolute -top-[18%] left-[30%] w-[55%] h-[42%] bg-amber-100/40 rounded-full blur-[40px]" />
          <div className="absolute -left-[14%] -top-[6%] w-[30%] h-[68%] bg-amber-50/60 rounded-full blur-[30px]" />
          <div className="absolute -right-[9%] -top-[10%] w-[27%] h-[58%] bg-amber-100/30 rounded-full blur-[40px]" />
          <div className="absolute -right-[7%] bottom-[-12%] w-[36%] h-[66%] bg-amber-50/50 rounded-full blur-[30px]" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
            {/* left */}
            <div className="space-y-6 relative">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Next-Generation Workforce Platform
                </div>
                <h1 className="text-[36px] sm:text-[52px] lg:text-[58px] font-black tracking-tight leading-[1.02]">
                  <span className="text-stone-900">Every workday,</span><br />
                  <span className="text-amber-500">perfectly aligned.</span>
                </h1>
                <p className="text-[14px] sm:text-[15px] leading-relaxed text-stone-600 max-w-[520px]">
                  DailyFlow is a powerful, modern HRMS that simplifies workforce directory, real-time attendance, time-off approvals, payroll slips, and team operations — so your team can focus on what truly matters.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-md shadow-amber-500/20 active:scale-98 transition cursor-pointer">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 shadow-2xs transition cursor-pointer">
                    Explore Demo <CalendarCheck className="ml-2 h-4 w-4 text-stone-500" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-stone-600">
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center"><Check className="h-3 w-3 text-amber-800" /></span> Easy to Use</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center"><Check className="h-3 w-3 text-amber-800" /></span> Secure &amp; Reliable</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center"><Check className="h-3 w-3 text-amber-800" /></span> Loved by Teams</span>
              </div>
            </div>

            {/* right mock */}
            <div className="relative lg:pl-4">
              <div className="relative rounded-3xl border border-stone-200 bg-white p-3 sm:p-5 shadow-xl overflow-hidden">
                {/* window bar */}
                <div className="relative flex items-center justify-between px-1.5 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 border border-stone-200 px-3 py-1 text-[11px] font-bold text-stone-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Today's attendance
                    </span>
                    <span className="hidden lg:inline text-[11px] text-stone-400 font-medium">Workforce at a glance</span>
                  </div>
                  <div className="h-7 w-7 rounded-xl bg-amber-500 flex items-center justify-center text-[10px] font-black text-stone-950 shadow-2xs">DF</div>
                </div>

                {/* stats */}
                <div className="relative grid grid-cols-4 gap-2 sm:gap-2.5 mt-3">
                  {[
                    { k: '24', l: 'Employees', c: 'text-stone-900', bg: 'bg-stone-50', border: 'border-stone-200', iconBg: 'bg-stone-200/70 text-stone-700', Icon: Users },
                    { k: '21', l: 'Present', c: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-700', Icon: Check },
                    { k: '2', l: 'On Break', c: 'text-amber-700', bg: 'bg-amber-50/70', border: 'border-amber-200', iconBg: 'bg-amber-100 text-amber-700', Icon: Clock },
                    { k: '1', l: 'Away', c: 'text-rose-700', bg: 'bg-rose-50/60', border: 'border-rose-200', iconBg: 'bg-rose-100 text-rose-700', Icon: X },
                  ].map(s => (
                    <div key={s.l} className={`rounded-2xl border ${s.border} ${s.bg} p-2.5 sm:p-3 text-center shadow-2xs`}>
                      <div className={`mx-auto h-6 w-6 rounded-xl ${s.iconBg} flex items-center justify-center mb-1.5`}><s.Icon className="h-3.5 w-3.5" /></div>
                      <div className={`text-[17px] font-black leading-none ${s.c}`}>{s.k}</div>
                      <div className="text-[10px] font-semibold text-stone-500 mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* employees */}
                <div className="relative grid grid-cols-2 gap-2.5 sm:gap-3 mt-3.5">
                  {[
                    { n: 'Aarav Sharma', id: 'DF0002', role: 'Engineering', email: 'aarav.sharma@dayflow.com', color: 'bg-emerald-500', ring: 'ring-emerald-100', dotBg: 'bg-emerald-500', img: 'https://i.pravatar.cc/100?img=11' },
                    { n: 'Priya Nair', id: 'DF0003', role: 'Design', email: 'priya.nair@dayflow.com', color: 'bg-emerald-500', ring: 'ring-emerald-100', dotBg: 'bg-emerald-500', img: 'https://i.pravatar.cc/100?img=5' },
                    { n: 'Kenji Tanaka', id: 'DF0004', role: 'HR Officer', email: 'kenji.tanaka@dayflow.com', color: 'bg-amber-500', ring: 'ring-amber-100', dotBg: 'bg-amber-500', img: 'https://i.pravatar.cc/100?img=8' },
                    { n: 'Sofia Lee', id: 'DF0005', role: 'Operations', email: 'sofia.lee@dayflow.com', color: 'bg-rose-500', ring: 'ring-rose-100', dotBg: 'bg-rose-500', img: 'https://i.pravatar.cc/100?img=9' },
                  ].map(e => (
                    <div key={e.id} className="group relative rounded-2xl border border-stone-200 bg-white p-3 flex gap-3 items-start shadow-2xs hover:border-amber-400 transition">
                      <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${e.dotBg} ring-4 ${e.ring} shadow-xs`} />
                      <div className={`h-10 w-10 rounded-xl p-[2px] bg-white shadow-2xs shrink-0`}>
                        <img src={e.img} alt={e.n} className="h-full w-full rounded-xl object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-none truncate text-stone-900">{e.n}</div>
                        <div className="text-[11px] text-stone-500 mt-1 font-medium">{e.id} • {e.role}</div>
                        <div className="text-[10px] text-stone-400 truncate mt-0.5">{e.email}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* payroll bar */}
                <div className="relative mt-3 rounded-2xl bg-amber-500 p-3.5 flex items-center justify-between text-stone-950 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-stone-950/10 flex items-center justify-center"><Wallet className="h-4.5 w-4.5 text-stone-950" /></div>
                    <div>
                      <div className="text-xs font-black leading-none text-stone-950">Payroll Ready</div>
                      <div className="text-[11px] text-stone-900/80 font-semibold mt-1">Disbursement generated • 24 salary slips</div>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-stone-950/10 flex items-center justify-center hover:bg-stone-950/20 transition cursor-pointer"><ChevronRight className="h-4 w-4 text-stone-950" /></div>
                </div>
              </div>

              {/* floating: Checked in */}
              <div className="hidden sm:flex absolute -left-6 bottom-8 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur px-3.5 py-3 shadow-lg items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"><Timer className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <div className="text-xs font-bold leading-none text-stone-900">Checked in — 09:12 AM</div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-1 font-medium"><MapPin className="h-3 w-3 text-amber-600" /> Verified Geolocation</div>
                </div>
              </div>
              {/* floating: Leave approved */}
              <div className="hidden sm:flex absolute -right-4 -top-2 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur pl-2.5 pr-3.5 py-2.5 shadow-lg items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs"><CalendarCheck className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-xs font-bold leading-none text-stone-900 flex items-center gap-1">Leave Approved <span className="text-emerald-600">✓</span></div>
                  <div className="text-[11px] text-stone-500 mt-1 font-medium">Paid Leave • 3 Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* trust strip */}
          <div className="mt-12 sm:mt-16 border-y border-stone-200/80 bg-stone-50/80 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
            <div className="mx-auto max-w-[1280px] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-stone-600">
              <span className="uppercase tracking-wider font-extrabold text-stone-900">Trusted by modern enterprises</span>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-600" /> Enterprise-grade security</span>
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-amber-600" /> Multi-tenant data privacy</span>
                <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-amber-600" /> Cloud PostgreSQL backed</span>
                <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-600" /> Sub-millisecond performance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <h2 className="text-[28px] sm:text-4xl font-extrabold tracking-tight text-stone-900">One platform for every workforce need</h2>
            <p className="text-xs sm:text-sm text-stone-600">From welcoming new hires to running payroll disbursements — DailyFlow keeps your workforce records accurate, your team connected, and your operations aligned.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10">
            {[
              {
                icon: Timer, title: 'Smart Attendance & GPS', desc: 'One-tap check-in and check-out for your team with geolocation and IP verification. Hours, breaks, and daily statuses compute automatically.',
                points: ['Real-time punch clock', 'IP & Geolocation verification', 'Automatic working hour calculation']
              },
              {
                icon: CalendarCheck, title: 'Time Off & Balances', desc: 'Interactive leave balances and policies. Employees apply in seconds; managers review and approve with instant balance deductions.',
                points: ['Paid, sick & unpaid quotas', 'One-click approve or decline', 'Dynamic real-time balance engine']
              },
              {
                icon: Wallet, title: 'Comprehensive Payroll', desc: 'Configurable earnings (Basic, HRA, Conveyance) and deductions (PF, Professional Tax). Generate PDF-ready salary slips in seconds.',
                points: ['Custom salary structure formulas', 'Disbursement warning engine', 'Official PDF salary slip generator']
              },
              {
                icon: Users, title: 'Workforce Directory', desc: 'Company-scoped employee directory with auto-generated IDs (e.g. DF0001), department filtering, and instant profile views.',
                points: ['Company-scoped employee IDs', 'Instant workforce search', 'Complete profile management']
              },
              {
                icon: ShieldCheck, title: 'Role-Based Access Control', desc: 'Role-specific dashboards for Administrators, HR Officers, Employees, and Interns ensuring sensitive data stays protected.',
                points: ['Admin, HR, Employee & Intern roles', 'Multi-tenant cloud isolation', 'Strict role permission safeguards']
              },
              {
                icon: Bell, title: 'Communication & Meetings', desc: 'One-click Phone, WhatsApp, Email, and instant Google Meet video links from any employee profile, plus real-time in-app alerts.',
                points: ['1-Click Communication Hub', 'Google Meet video integration', 'Real-time alert notifications']
              },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 hover:border-amber-400 hover:shadow-xs transition group">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center group-hover:bg-amber-100 transition"><f.icon className="h-5 w-5 text-amber-600" /></div>
                <h3 className="mt-4 font-bold text-sm text-stone-900">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">{f.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {f.points.map(p => <li key={p} className="flex items-center gap-2 text-xs text-stone-600 font-medium"><Check className="h-3.5 w-3.5 text-emerald-600" /> {p}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shrink-0"><Layers className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Scalable & Secure Multi-Tenant Architecture</h3>
                  <p className="text-xs text-stone-600 mt-1">Whether you manage a startup of 5 or an enterprise of 5,000+, each organization operates in isolated security backed by Supabase Cloud PostgreSQL and resilient cloud persistence.</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold">
                    <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs">Multi-Tenant Organization Workspaces</span>
                    <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs">Encrypted Document Cloud Storage</span>
                    <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs">Sub-Millisecond Queries</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 flex flex-col justify-between shadow-2xs">
              <div>
                <TrendingUp className="h-6 w-6 text-amber-600" />
                <h3 className="font-bold text-sm mt-3 text-stone-900">Workforce Analytics</h3>
                <p className="text-xs text-stone-600 mt-1">Real-time attendance rates, leave utilization trends, and payroll compensation analytics at a glance.</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-stone-500"><BarChart3 className="h-4 w-4 text-amber-500" /> Real-Time Analytics & CSV Export</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how-it-works" className="relative overflow-hidden border-y border-stone-200 bg-[#fcfbf9]">
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">3-Step Rapid Onboarding</div>
              <h2 className="mt-3 text-[28px] sm:text-4xl font-extrabold tracking-tight text-stone-900">From setup to payroll in minutes</h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md">No messy spreadsheets. No manual data reconciliation. DailyFlow automates the operational heavy lifting.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10 relative">
            {[
              { step: '01', icon: Building2, title: 'Register Workspace', desc: 'Create your company organization with custom departments and admin credentials in under 60 seconds.' },
              { step: '02', icon: UserPlus, title: 'Onboard Your Team', desc: 'Invite HR officers, employees, and interns. Automated credentials and generated employee IDs are issued instantly.' },
              { step: '03', icon: FileText, title: 'Seamless Operations', desc: 'Your team punches attendance daily, managers approve leave requests, and payroll disbursements run with full accuracy.' },
            ].map(s => (
              <div key={s.step} className="relative">
                <div className="mx-auto md:mx-0 h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs relative z-10"><s.icon className="h-5 w-5" /></div>
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs">
                  <div className="text-[10px] tracking-widest text-amber-600 font-extrabold">STEP {s.step}</div>
                  <h3 className="mt-1 font-bold text-sm text-stone-900">{s.title}</h3>
                  <p className="mt-2 text-xs text-stone-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ROLES ---------- */}
      <section id="roles" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[28px] sm:text-4xl font-extrabold tracking-tight text-stone-900">Designed for every workforce role</h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600">Executive leaders get control. HR managers get clarity. Employees and interns get simplicity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              { role: 'System Administrator', badge: 'Full Admin Access', icon: ShieldCheck, items: ['Company settings & branding management', 'Workforce directory & department creation', 'Custom leave policies & payroll disbursements', 'Complete workforce analytics & security audits'] },
              { role: 'HR Manager', badge: 'HR Operations', icon: Users, items: ['Staff & intern onboarding directory', 'Time-off requests review & approval queue', 'Compensation structures & monthly salary slips', 'Team attendance & real-time notifications'] },
              { role: 'Employee & Intern', badge: 'Self-Service Portal', icon: Sparkles, items: ['1-Tap punch clock & attendance timeline', 'Leave request submissions & balance lookup', 'Official printable monthly salary slips', 'Interactive AI HR assistant & Communication Hub'] },
            ].map(r => (
              <div key={r.role} className="rounded-2xl border border-stone-200 bg-white p-6 flex flex-col shadow-2xs hover:border-amber-400 transition">
                <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-xs"><r.icon className="h-5 w-5" /></div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-900">{r.role}</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 uppercase">{r.badge}</span>
                </div>
                <ul className="mt-4 space-y-2 flex-1">
                  {r.items.map(i => <li key={i} className="flex gap-2 text-xs text-stone-600 font-medium"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> {i}</li>)}
                </ul>
                <Link to="/signup" className="mt-6 text-xs text-amber-700 font-bold flex items-center gap-1 hover:gap-2 transition-all">Get started with DailyFlow <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PRICING ---------- */}
      <section id="pricing" className="relative overflow-hidden border-y border-stone-200 bg-[#fcfbf9]">
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[28px] sm:text-4xl font-extrabold tracking-tight text-stone-900">Transparent pricing for growing teams</h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600">Start free with core modules. Scale seamlessly as your headcount expands.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-10 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 'Free', sub: 'Up to 5 employees', cta: 'Create Free Company', featured: false, features: ['Workforce directory & employee profiles', 'Attendance check-in & duration logs', 'Leave policy & balance manager', 'Monthly payroll & printable payslips', 'Email invitations & notification alerts'] },
              { name: 'Growth', price: '₹199', sub: 'per employee / month', cta: 'Get Started with Growth', featured: true, features: ['Everything in Starter', 'AI HR Chatbot assistant with live context', 'Google Meet 1-click video call integration', 'Intern lifecycle & evaluation module', '100GB encrypted cloud document storage'] },
              { name: 'Enterprise', price: 'Custom', sub: 'Unlimited employees', cta: 'Contact Enterprise Team', featured: false, features: ['Everything in Growth', 'Dedicated Supabase PostgreSQL instance', 'Custom domain & corporate branding', 'Biometric punch machine hardware sync', '24/7 dedicated support & SLA guarantees'] },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl border bg-white p-6 flex flex-col relative ${p.featured ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20' : 'border-stone-200 shadow-2xs'}`}>
                {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold bg-amber-500 text-stone-950 px-3 py-1 rounded-full shadow-xs uppercase">Most Popular</div>}
                <h3 className="font-bold text-base text-stone-900">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-stone-900">{p.price}</span>
                  {p.price !== 'Free' && p.price !== 'Custom' && <span className="text-xs text-stone-500 font-medium">{p.sub}</span>}
                </div>
                {(p.price==='Free' || p.price==='Custom') && <div className="text-xs text-stone-500 font-medium mt-0.5">{p.sub}</div>}
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map(f => <li key={f} className="flex gap-2 text-xs text-stone-700 font-medium"><Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {f}</li>)}
                </ul>
                <Link to="/signup" className="mt-6">
                  <button className={`w-full inline-flex items-center justify-center rounded-xl h-10 px-4 text-xs font-bold transition cursor-pointer ${p.featured ? 'bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-xs' : 'border border-stone-300 bg-white hover:bg-stone-50 text-stone-900'}`}>{p.cta}</button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-stone-500 font-medium mt-6">All plans include SSL encryption, automated database backups, and full multi-tenant isolation.</p>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative overflow-hidden bg-[#fcfbf9] px-4 sm:px-6 py-12">
        <div className="relative mx-auto max-w-[1280px] rounded-3xl bg-stone-900 p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to transform your workforce operations?</h2>
          <p className="mt-3 text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto">Create your organization workspace in 60 seconds. Onboard your team and harmonize attendance, time off, payroll, and meetings.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <button className="inline-flex items-center justify-center rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 px-8 h-11 text-xs font-bold shadow-md transition cursor-pointer">
                Create Free Organization <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
            <Link to="/login">
              <button className="inline-flex items-center justify-center rounded-xl border border-stone-700 bg-stone-800 text-white hover:bg-stone-700 px-8 h-11 text-xs font-semibold transition cursor-pointer">
                Sign In to Existing Workspace
              </button>
            </Link>
          </div>
          <div className="mt-4 text-[11px] text-stone-400 font-medium">Free for up to 5 employees • No credit card required • Instant setup</div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="relative overflow-hidden border-t border-stone-200 bg-white">
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xs">DF</span>
                <span className="font-extrabold text-base text-stone-900">Daily<span className="text-amber-500 font-black">Flow</span></span>
              </div>
              <p className="mt-3 text-xs text-stone-600 max-w-sm leading-relaxed">The complete, full-stack Human Resource Management System for modern organizations. Built with React, FastAPI, Supabase Cloud PostgreSQL, and JWT RBAC.</p>
              <div className="mt-4 text-xs text-stone-400 font-medium">© 2026 DailyFlow Technologies. All rights reserved.</div>
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">Product</div>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-stone-600">
                <li><a href="#features" className="hover:text-amber-600 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-amber-600 transition">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-600 transition">How it works</a></li>
                <li><Link to="/login" className="hover:text-amber-600 transition">Live Demo</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">Resources</div>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-stone-600">
                <li><Link to="/help" className="hover:text-amber-600 transition">Help Center</Link></li>
                <li><Link to="/getting-started" className="hover:text-amber-600 transition">Getting Started Guide</Link></li>
                <li><Link to="/support" className="hover:text-amber-600 transition">Technical Support</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">Company</div>
              <ul className="mt-3 space-y-2 text-xs font-semibold text-stone-600">
                <li><Link to="/about" className="hover:text-amber-600 transition">About DailyFlow</Link></li>
                <li><Link to="/contact" className="hover:text-amber-600 transition">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-amber-600 transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-amber-600 transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-medium">
            <span>Every workday, perfectly aligned.</span>
            <span>Enterprise Grade • Sub-millisecond Queries • Zero Data Loss</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

