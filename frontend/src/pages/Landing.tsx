import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Clock, CalendarCheck, Wallet, Users, ShieldCheck, Bell,
  ArrowRight, Check, Sparkles, Building2, UserPlus, BarChart3,
  MapPin, Timer, FileText, Layers, TrendingUp, Lock, Globe, Zap, Menu, X, Play, ChevronRight
} from 'lucide-react'
import { useAuth } from '../stores/auth'
import StafloLogo, { StafloIcon } from '../components/Logo'
import { openRazorpayCheckout } from '../lib/razorpay'

const BRAND = 'var(--theme-primary, #004E72)'

export default function Landing() {
  const { token } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans">
      {/* ---------- NAV - always white (landing white-only) ---------- */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <StafloIcon size={32} />
              <span className="font-logo text-[22px] tracking-tight text-zinc-900 dark:text-zinc-100">Staflo</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 text-sm">
              <a href="#features" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 transition">Features</a>
              <a href="#how-it-works" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 transition">How it works</a>
              <a href="#roles" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 transition">For Teams</a>
              <a href="#pricing" className="px-3 py-2 text-zinc-600 hover:text-zinc-900 transition">Pricing</a>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {token ? (
              <Link to="/dashboard">
                <button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#004E72] text-white hover:bg-[#FF6E42] shadow">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-2">Sign In</Link>
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#004E72] text-white hover:bg-[#FF6E42] shadow">
                    Create Company <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                </Link>
              </>
            )}
          </div>

          <button className="lg:hidden h-9 w-9 rounded-md border border-zinc-200 bg-white flex items-center justify-center text-zinc-700" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-700">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-700">How it works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-700">Pricing</a>
            <div className="pt-3 flex flex-col gap-2">
              {token ? <Link to="/dashboard" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-md h-10 px-4 font-medium bg-[#004E72] text-white">Go to Dashboard</button></Link>
                : <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-md h-10 px-4 font-medium border border-zinc-200 bg-white">Sign In</button></Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}><button className="w-full inline-flex items-center justify-center rounded-md h-10 px-4 font-medium bg-[#004E72] text-white">Create Company</button></Link>
                </>}
            </div>
          </div>
        )}
      </header>

      {/* ---------- HERO - with soft organic blob BG from reference ---------- */}
      <section className="relative overflow-hidden bg-[#F9F9F9]">
        {/* organic pastel blobs - matches reference image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* base warm off-white */}
          <div className="absolute inset-0 bg-[#F9F9F9]" />
          {/* top warm wash - peach / cream */}
          <div className="absolute -top-[18%] left-[30%] w-[55%] h-[42%] bg-[#FFF1E6] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] blur-[30px] opacity-80" />
          {/* left large organic blob - cream/peach */}
          <div className="absolute -left-[14%] -top-[6%] w-[30%] h-[68%] bg-[#FDF0E2] rounded-[60%_40%_40%_60%/55%_60%_40%_45%] opacity-95" />
          {/* left small accent - tighter peach curve */}
          <div className="absolute left-[2%] top-[12%] w-[12%] h-[38%] bg-[#FDF0E2]/60 rounded-full blur-[12px]" />
          {/* bottom-left coral / pink blob */}
          <div className="absolute -left-[5%] -bottom-[10%] w-[19%] h-[42%] bg-[#F8C5C0] rounded-[70%_30%_60%_40%/40%_50%_60%_50%] opacity-90" />
          <div className="absolute -left-[2%] bottom-[6%] w-[10%] h-[22%] bg-[#F9B8B0]/60 rounded-[40%_60%_70%_30%/50%_40%_60%_50%] blur-[8px]" />
          {/* right top lavender blob */}
          <div className="absolute -right-[9%] -top-[10%] w-[27%] h-[58%] bg-[#DDCFF2] rounded-[40%_60%_50%_50%/50%_40%_60%_50%] opacity-95" />
          {/* right bottom mint blob */}
          <div className="absolute -right-[7%] bottom-[-12%] w-[36%] h-[66%] bg-[#C2E9DF] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-95" />
          {/* center-bottom mint for arrow area */}
          <div className="absolute left-[30%] -bottom-[16%] w-[30%] h-[44%] bg-[#BFE8DD] rounded-[50%_50%_40%_60%/60%_40%_60%_40%] opacity-90" />
          {/* subtle inner highlight on mint to add depth */}
          <div className="absolute right-[8%] bottom-[18%] w-[18%] h-[28%] bg-[#D4F0E8]/50 rounded-full blur-[18px]" />
          {/* faint dot texture - like reference subtle grain */}
          <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#004E72_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
            {/* left - matches reference */}
            <div className="space-y-6 relative">
              <div className="space-y-4">
                <h1 className="text-[36px] sm:text-[52px] lg:text-[58px] font-extrabold tracking-tight leading-[0.95]">
                  <span className="text-[#092634]">Every workday,</span><br />
                  <span className="text-[#FF6E42]">perfectly aligned.</span>
                </h1>
                <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#5A6B7A] max-w-[520px]">
                  Staflo is a powerful HRMS that simplifies employee management, attendance, leave, payroll and more — so your team can focus on what truly matters.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-[14px] font-semibold bg-[#004E72] text-white hover:bg-[#FF6E42] shadow-[0_4px_20px_rgba(0,78,114,0.3)]">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-[14px] font-medium border border-[#E8D5E0] bg-white hover:bg-zinc-50 text-zinc-700 shadow-sm">
                    Book a Demo <CalendarCheck className="ml-2 h-4 w-4 text-zinc-500" />
                  </button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#5A6B7A]">
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-[#C7E8DD] flex items-center justify-center"><Check className="h-3 w-3 text-[#2E7D62]" /></span> Easy to Use</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-[#C7E8DD] flex items-center justify-center"><Check className="h-3 w-3 text-[#2E7D62]" /></span> Secure &amp; Reliable</span>
                <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full bg-[#C7E8DD] flex items-center justify-center"><Check className="h-3 w-3 text-[#2E7D62]" /></span> Loved by Teams</span>
              </div>

              {/* curved arrow - like reference */}
              <div className="hidden lg:block absolute -right-6 -bottom-6 pointer-events-none">
                <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
                  <path d="M10 70 C 30 70, 45 50, 70 30 C 80 20, 95 12, 100 10" stroke="#8B5A9C" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="0" />
                  <path d="M88 6 L100 10 L92 22" stroke="#8B5A9C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>

            {/* right mock - redesigned */}
            <div className="relative lg:pl-4">
              <div className="relative rounded-[28px] border border-zinc-200/80 bg-white p-3 sm:p-4 shadow-[0_24px_64px_rgba(23,23,23,0.08),0_8px_24px_rgba(23,23,23,0.06)] overflow-hidden">
                {/* subtle inner glow */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-10 -right-10 w-[220px] h-[220px] bg-[#DDCFF2]/20 rounded-full blur-[32px]" />
                  <div className="absolute -bottom-10 -left-10 w-[220px] h-[220px] bg-[#C2E9DF]/18 rounded-full blur-[30px]" />
                </div>
                {/* window bar */}
                <div className="relative flex items-center justify-between px-1.5 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57] border border-black/10 shadow-inner" />
                    <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
                    <span className="h-3 w-3 rounded-full bg-[#28CA42] border border-black/10 shadow-inner" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] animate-pulse" /> Today's attendance
                    </span>
                    <span className="hidden lg:inline text-[11px] text-zinc-400 tracking-tight">Your team at a glance</span>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#004E72] to-[#FF6E42] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white">OS</div>
                </div>

                {/* stats */}
                <div className="relative grid grid-cols-4 gap-2 sm:gap-2.5 mt-2.5">
                  {[
                    { k: '24', l: 'Employees', c: 'text-zinc-900', bg: 'bg-white', border: 'border-zinc-200', iconBg: 'bg-zinc-100 text-zinc-600', Icon: Users },
                    { k: '21', l: 'Present', c: 'text-emerald-600', bg: 'bg-emerald-50/70', border: 'border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', Icon: Check },
                    { k: '2', l: 'On Break', c: 'text-amber-600', bg: 'bg-amber-50/70', border: 'border-amber-100', iconBg: 'bg-amber-100 text-amber-600', Icon: Clock },
                    { k: '1', l: 'Away', c: 'text-rose-600', bg: 'bg-rose-50/60', border: 'border-rose-100', iconBg: 'bg-rose-100 text-rose-600', Icon: X },
                  ].map(s => (
                    <div key={s.l} className={`rounded-[16px] border ${s.border} ${s.bg} p-2.5 sm:p-3 text-center backdrop-blur shadow-sm hover:shadow-md transition-shadow`}>
                      <div className={`mx-auto h-6 w-6 rounded-full ${s.iconBg} flex items-center justify-center mb-1.5`}><s.Icon className="h-3.5 w-3.5" /></div>
                      <div className={`text-[18px] font-extrabold leading-none tracking-tight ${s.c}`}>{s.k}</div>
                      <div className="text-[10px] font-medium text-zinc-500 mt-1 tracking-wide">{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* employees */}
                <div className="relative grid grid-cols-2 gap-2.5 sm:gap-3 mt-3.5">
                  {[
                    { n: 'Aarav Sharma', id: 'OS0002', role: 'Engineering', email: 'aarav.sharma@staflo.io', color: 'bg-emerald-500', ring: 'ring-emerald-100', dotBg: 'bg-emerald-500', img: 'https://i.pravatar.cc/100?img=11' },
                    { n: 'Priya Nair', id: 'OS0003', role: 'Design', email: 'priya.nair@staflo.io', color: 'bg-emerald-500', ring: 'ring-emerald-100', dotBg: 'bg-emerald-500', img: 'https://i.pravatar.cc/100?img=5' },
                    { n: 'Kenji Tanaka', id: 'OS0004', role: 'HR', email: 'kenji.tanaka@staflo.io', color: 'bg-amber-500', ring: 'ring-amber-100', dotBg: 'bg-amber-500', img: 'https://i.pravatar.cc/100?img=8' },
                    { n: 'Sofia Lee', id: 'OS0005', role: 'Sales', email: 'sofia.lee@staflo.io', color: 'bg-rose-500', ring: 'ring-rose-100', dotBg: 'bg-rose-500', img: 'https://i.pravatar.cc/100?img=9' },
                  ].map(e => (
                    <div key={e.id} className="group relative rounded-[16px] border border-zinc-200 bg-white p-3 flex gap-3 items-start hover:border-zinc-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
                      <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${e.dotBg} ring-4 ${e.ring} shadow-sm`} />
                      <div className={`h-10 w-10 rounded-full p-[2px] bg-white shadow-sm ring-1 ${e.ring} shrink-0`}>
                        <img src={e.img} alt={e.n} className="h-full w-full rounded-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold leading-none truncate text-zinc-900">{e.n}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">{e.id} • {e.role}</div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">{e.email}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* payroll bar */}
                <div className="relative mt-3 rounded-[16px] bg-gradient-to-r from-[#004E72] via-[#FF6E42] to-[#FF6E42] p-[1px] shadow-[0_8px_24px_rgba(0,78,114,0.22)]">
                  <div className="rounded-[15px] bg-gradient-to-r from-[#004E72] to-[#092634] px-4 py-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center"><Wallet className="h-4.5 w-4.5 text-white" /></div>
                      <div>
                        <div className="text-[13px] font-semibold leading-none">Payroll ready</div>
                        <div className="text-xs text-white/80 mt-1">March completed • 24 payslips • Tap to view</div>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur hover:bg-white/20 transition"><ChevronRight className="h-4 w-4 text-white" /></div>
                  </div>
                </div>
              </div>

              {/* floating: Checked in */}
              <div className="hidden sm:flex absolute -left-8 bottom-8 rounded-[14px] border border-zinc-200 bg-white/95 backdrop-blur px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)] items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"><Timer className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <div className="text-[11px] font-semibold leading-none text-zinc-900">Checked in — 09:12 AM</div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> Bengaluru • Verified</div>
                </div>
                {/* tail */}
                <div className="absolute -right-1.5 bottom-4 h-3 w-3 bg-white border-r border-b border-zinc-200 rotate-[-45deg]" />
              </div>
              {/* floating: Leave approved */}
              <div className="hidden sm:flex absolute -right-5 -top-1 rounded-[14px] border border-zinc-200 bg-white/95 backdrop-blur pl-2 pr-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#004E72] flex items-center justify-center text-white shadow-sm"><CalendarCheck className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-xs font-semibold leading-none text-zinc-900 flex items-center gap-1">Leave approved <span className="text-emerald-500">✓</span></div>
                  <div className="text-[11px] text-zinc-500 mt-1">Paid • 12 → 14 Mar</div>
                </div>
              </div>
            </div>
          </div>

          {/* trust strip - light */}
          <div className="mt-12 sm:mt-16 border-y border-zinc-200 bg-zinc-50/80 backdrop-blur -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
            <div className="mx-auto max-w-[1280px] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
              <span className="uppercase tracking-[0.14em] font-semibold">Trusted by growing businesses</span>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-zinc-500" /> Enterprise-grade security</span>
                <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-zinc-500" /> Your data stays private</span>
                <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-zinc-500" /> Separate & secure workspaces</span>
                <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-zinc-500" /> Always available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES - with pastel blobs ---------- */}
      <section id="features" className="relative overflow-hidden bg-white">
        {/* soft blobs - unique per section */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[8%] -left-[10%] w-[420px] h-[420px] bg-[#FDF0E2] rounded-[60%_40%_55%_45%/50%_60%_40%_50%] opacity-70" />
          <div className="absolute -top-[6%] -right-[8%] w-[380px] h-[380px] bg-[#DDCFF2]/45 rounded-[40%_60%_45%_55%/55%_45%_60%_40%] opacity-70" />
          <div className="absolute bottom-[12%] right-[18%] w-[520px] h-[320px] bg-[#C2E9DF]/28 rounded-[50%_50%_30%_70%/40%_50%_60%_50%] blur-[6px]" />
          <div className="absolute bottom-[18%] left-[22%] w-[220px] h-[220px] bg-[#F8C5C0]/18 rounded-full blur-[22px]" />
          <div className="absolute top-[42%] left-[48%] w-[180px] h-[180px] bg-[#FFF1E6]/60 rounded-[50%_50%_50%_50%] blur-[12px]" />
          <div className="absolute inset-0 opacity-[0.022] bg-[radial-gradient(#004E72_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <h2 className="text-[28px] sm:text-4xl font-bold tracking-tight text-zinc-900">One platform for every HR need</h2>
          <p className="text-sm sm:text-[15px] text-zinc-600">From welcoming new hires to running payroll — Staflo keeps your records accurate, your team informed, and your people happy.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10">
          {[
            {
              icon: Timer, title: 'Smart Attendance', desc: 'One-tap check-in and check-out for your team. Hours and daily status are calculated automatically — so you always have an accurate picture.',
              points: ['One-tap check-in', 'Hours calculated automatically', 'Ready for accurate payroll']
            },
            {
              icon: CalendarCheck, title: 'Time Off Management', desc: 'Simple calendars for everyone, clear approvals for managers. Track vacation, sick leave and more with live balances.',
              points: ['Vacation, sick & unpaid leave', 'One-click approve or decline', 'Live leave balances']
            },
            {
              icon: Wallet, title: 'Effortless Payroll', desc: 'Set up earnings and deductions once — allowances, benefits, taxes. Run payroll in minutes with clear breakdowns for every employee.',
              points: ['Allowances & deductions included', 'Custom salary structures', 'Clear payslip for everyone']
            },
            {
              icon: Users, title: 'People Directory', desc: 'Find anyone in seconds. A beautiful overview of your entire team with quick search and instant access to profiles.',
              points: ['Search anyone instantly', 'Live availability at a glance', 'Complete employee profiles']
            },
            {
              icon: ShieldCheck, title: 'Privacy & Access Control', desc: 'Everyone sees what they should — and nothing they shouldn’t. Sensitive details like salary stay visible only to the right people.',
              points: ['Roles for admins, managers & staff', 'Your company data stays separate', 'Sensitive info stays protected']
            },
            {
              icon: Bell, title: 'Easy Invites & Updates', desc: 'Add new people by email in seconds. They get a secure invite, and everyone stays informed with timely alerts.',
              points: ['Invite by email in seconds', 'Secure access for everyone', 'Stay updated automatically']
            },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 hover:border-zinc-300 hover:shadow-sm transition group">
              <div className="h-10 w-10 rounded-xl bg-[#004E72]/10 border border-[#004E72]/10 flex items-center justify-center group-hover:bg-[#004E72]/15 transition"><f.icon className="h-5 w-5 text-[#004E72]" /></div>
              <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {f.points.map(p => <li key={p} className="flex items-center gap-2 text-xs text-zinc-600"><Check className="h-3.5 w-3.5 text-green-600" /> {p}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* secondary highlight - light */}
        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#004E72] flex items-center justify-center shrink-0"><Layers className="h-5 w-5 text-white" /></div>
              <div>
                <h3 className="font-semibold text-zinc-900">Built to grow with you</h3>
                <p className="text-sm text-zinc-600 mt-1">Whether you run one company or many, each workspace stays fully separate and secure. Add teams, offices and employees — Staflo scales as you do, without complexity.</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 shadow-sm">Ready for 5 to 5,000+ employees</span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 shadow-sm">Secure document storage</span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 shadow-sm">Fast, reliable & secure</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col justify-between shadow-sm">
            <div>
              <TrendingUp className="h-6 w-6 text-[#004E72]" />
              <h3 className="font-semibold mt-3 text-zinc-900">Insights that drive decisions</h3>
              <p className="text-sm text-zinc-600 mt-1">Understand attendance, time off and payroll at a glance — with reports you can filter by date, team or person.</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><BarChart3 className="h-4 w-4" /> Daily • Weekly • Monthly</div>
          </div>
        </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS - with blobs ---------- */}
      <section id="how-it-works" className="relative overflow-hidden border-y border-zinc-200 bg-[#F9F9F9]">
        {/* subtle blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[8%] top-[10%] w-[360px] h-[360px] bg-[#C2E9DF]/40 rounded-[50%_40%_60%_50%/60%_50%_40%_50%] opacity-70" />
          <div className="absolute -right-[10%] -top-[12%] w-[420px] h-[420px] bg-[#DDCFF2]/35 rounded-[45%_55%_40%_60%/60%_40%_55%_45%] opacity-60" />
          <div className="absolute left-[42%] bottom-[-14%] w-[480px] h-[260px] bg-[#FDF0E2]/60 rounded-[60%_40%_40%_60%/50%_60%_40%_50%]" />
          <div className="absolute right-[30%] top-[28%] w-[140px] h-[140px] bg-[#F8C5C0]/22 rounded-full blur-[14px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#004E72_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 shadow-sm">How it works • 3 simple steps</div>
              <h2 className="mt-3 text-[28px] sm:text-4xl font-bold tracking-tight text-zinc-900">From setup to payroll in minutes</h2>
            </div>
            <p className="text-sm text-zinc-600 max-w-md">No spreadsheets. No manual work. Staflo handles the busywork so you can focus on your people.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10 relative">
            <div className="hidden md:block absolute top-[34px] left-[14%] right-[14%] h-[2px] bg-gradient-to-r from-[#004E72]/0 via-[#004E72]/20 to-[#004E72]/0" />
            {[
              { step: '01', icon: Building2, title: 'Create Your Workspace', desc: 'Sign up with your company name. Your workspace is ready in under a minute — you’re all set to get started.' },
              { step: '02', icon: UserPlus, title: 'Invite Your Team', desc: 'Add teammates by email. They receive a secure invitation with everything they need to join right away.' },
              { step: '03', icon: FileText, title: 'Run Your Day-to-Day', desc: 'Your team checks in daily, managers approve time off, and you run payroll with clear, accurate breakdowns.' },
            ].map(s => (
              <div key={s.step} className="relative">
                <div className="mx-auto md:mx-0 h-10 w-10 rounded-full bg-[#004E72] flex items-center justify-center text-sm font-bold shadow-md shadow-[#004E72]/15 relative z-10 text-white"><s.icon className="h-5 w-5" /></div>
                <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="text-xs tracking-widest text-[#004E72] font-semibold">STEP {s.step}</div>
                  <h3 className="mt-1 font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ROLES - with blobs ---------- */}
      <section id="roles" className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[9%] top-[18%] w-[340px] h-[340px] bg-[#FDF0E2]/55 rounded-[55%_45%_50%_50%/45%_55%_45%_55%] opacity-70" />
          <div className="absolute -right-[8%] bottom-[8%] w-[420px] h-[420px] bg-[#DDCFF2]/35 rounded-[40%_60%_55%_45%/60%_40%_50%_50%] opacity-60" />
          <div className="absolute left-[38%] -top-[10%] w-[500px] h-[280px] bg-[#C2E9DF]/22 rounded-[60%_40%_30%_70%/50%_30%_70%_50%] blur-[4px]" />
          <div className="absolute right-[25%] bottom-[22%] w-[160px] h-[160px] bg-[#F8C5C0]/18 rounded-full blur-[16px]" />
          <div className="absolute inset-0 opacity-[0.022] bg-[radial-gradient(#004E72_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] sm:text-4xl font-bold tracking-tight text-zinc-900">Designed for every role</h2>
          <p className="mt-3 text-sm text-zinc-600">Leaders get control. Managers get clarity. Employees get a simple experience.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { role: 'Company Admin', badge: 'Full access', icon: ShieldCheck, color: 'from-[#004E72] to-[#092634]', items: ['Full team overview & invite anyone', 'Manage company settings & branding', 'View attendance and run payroll', 'Approve time off & manage salaries'] },
            { role: 'HR Manager', badge: 'Team lead', icon: Users, color: 'from-[#5b7fa6] to-[#7aa0c4]', items: ['Invite and manage team members', 'Review and approve time off', 'Set up payroll components', 'Generate attendance & payroll reports'] },
            { role: 'Employee', badge: 'Self-service', icon: Sparkles, color: 'from-[#d98a5c] to-[#e8a87c]', items: ['Personal profile & documents', 'One-tap check-in and status update', 'Request time off in seconds', 'View payslips — clear and simple'] },
          ].map(r => (
            <div key={r.role} className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col shadow-sm hover:shadow-md transition">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center`}><r.icon className="h-5 w-5 text-white" /></div>
              <div className="mt-4 flex items-center gap-2"><h3 className="font-semibold text-zinc-900">{r.role}</h3><span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600">{r.badge}</span></div>
              <ul className="mt-4 space-y-2 flex-1">
                {r.items.map(i => <li key={i} className="flex gap-2 text-sm text-zinc-600"><Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {i}</li>)}
              </ul>
              <Link to="/signup" className="mt-6 text-sm text-[#004E72] flex items-center gap-1 hover:gap-2 transition-all font-medium">Get started <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ---------- PRICING - with blobs ---------- */}
      <section id="pricing" className="relative overflow-hidden border-y border-zinc-200 bg-[#F9F9F9]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[10%] -top-[14%] w-[440px] h-[440px] bg-[#F8C5C0]/28 rounded-[50%_50%_40%_60%/60%_40%_60%_40%] opacity-60" />
          <div className="absolute -right-[9%] top-[8%] w-[380px] h-[380px] bg-[#DDCFF2]/38 rounded-[45%_55%_60%_40%/40%_60%_40%_60%] opacity-65" />
          <div className="absolute left-[28%] bottom-[-10%] w-[600px] h-[300px] bg-[#C2E9DF]/26 rounded-[40%_60%_50%_50%/60%_40%_60%_40%] blur-[5px]" />
          <div className="absolute right-[18%] bottom-[18%] w-[140px] h-[140px] bg-[#FDF0E2]/70 rounded-full blur-[12px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#004E72_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[28px] sm:text-4xl font-bold tracking-tight text-zinc-900">Simple pricing, scale as you grow</h2>
            <p className="mt-3 text-sm text-zinc-600">Start free. Upgrade when your team does. All plans include enterprise-grade security and support.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-10 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 'Free', sub: 'Up to 5 employees', cta: 'Create Free Company', featured: false, isPaid: false, amount: 0, features: ['Team directory & profiles', 'Attendance tracking', 'Time off (vacation, sick, unpaid)', 'Payroll & payslips', 'Secure invites & alerts'] },
              { name: 'Growth', price: '₹199', sub: 'per employee / month', cta: 'Pay with Razorpay', featured: true, isPaid: true, amount: 199, features: ['Everything in Starter', 'Advanced reports & exports', '100GB secure storage', 'Priority support', 'Custom payroll setup'] },
              { name: 'Enterprise', price: 'Custom', sub: 'Unlimited employees', cta: 'Contact Sales', featured: false, isPaid: false, amount: 0, features: ['Everything in Growth', 'Single sign-on & detailed audit trail', 'Dedicated support & SLA', 'On-premise option available', 'Custom branding & domain'] },
            ].map(p => (
              <div key={p.name} className={`rounded-xl border bg-white p-6 flex flex-col relative shadow-sm ${p.featured ? 'border-[#004E72]/30 bg-gradient-to-b from-[#004E72]/[0.06] to-white shadow-[0_12px_32px_rgba(0,78,114,0.12)]' : 'border-zinc-200'}`}>
                {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-[#004E72] text-white px-3 py-1 rounded-full">Most popular</div>}
                <h3 className="font-semibold text-zinc-900">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-bold text-zinc-900">{p.price}</span>{p.price !== 'Free' && p.price !== 'Custom' && <span className="text-sm text-zinc-500">{p.sub}</span>}</div>
                { (p.price==='Free' || p.price==='Custom') && <div className="text-xs text-zinc-500">{p.sub}</div>}
                <ul className="mt-6 space-y-2 flex-1">
                  {p.features.map(f => <li key={f} className="flex gap-2 text-sm text-zinc-700"><Check className="h-4 w-4 text-green-600 shrink-0" /> {f}</li>)}
                </ul>
                {p.isPaid ? (
                  <button
                    onClick={() => {
                      openRazorpayCheckout({
                        planName: p.name,
                        amountInINR: p.amount,
                        onSuccess: (res) => {
                          alert(`Payment successful! Payment ID: ${res.payment_id}. Welcome to Staflo ${p.name}!`)
                        },
                        onError: (err) => {
                          if (err !== 'Payment modal closed by user') {
                            alert(`Payment error: ${err}`)
                          }
                        }
                      })
                    }}
                    className="mt-6 w-full inline-flex items-center justify-center rounded-full h-10 px-4 font-medium bg-[#004E72] text-white hover:bg-[#FF6E42] shadow transition cursor-pointer"
                  >
                    {p.cta}
                  </button>
                ) : (
                  <Link to="/signup" className="mt-6">
                    <button className="w-full inline-flex items-center justify-center rounded-full h-10 px-4 font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900">{p.cta}</button>
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500 mt-6">All prices in INR. GST extra. Cancel anytime. Pre-configured for Indian payroll — ready to use from day one.</p>
        </div>
      </section>

      {/* ---------- FINAL CTA - with surrounding blobs ---------- */}
      <section className="relative overflow-hidden bg-[#F9F9F9] px-4 sm:px-6 py-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[8%] top-[6%] w-[320px] h-[320px] bg-[#FDF0E2] rounded-[60%_40%_50%_50%/50%_60%_40%_50%] opacity-70" />
          <div className="absolute -right-[10%] bottom-[-12%] w-[360px] h-[360px] bg-[#DDCFF2]/40 rounded-[40%_60%_45%_55%/55%_45%_60%_40%]" />
          <div className="absolute left-[35%] bottom-[-8%] w-[400px] h-[220px] bg-[#C2E9DF]/35 rounded-[50%_50%_30%_70%/40%_60%_40%_60%] blur-[4px]" />
          <div className="absolute right-[28%] top-[14%] w-[120px] h-[120px] bg-[#F8C5C0]/25 rounded-full blur-[14px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] rounded-[24px] border border-[#004E72]/15 bg-gradient-to-br from-[#004E72] via-[#FF6E42] to-[#092634] p-[1px]">
          <div className="rounded-[23px] bg-gradient-to-br from-[#004E72] via-[#092634] to-[#092634] px-6 sm:px-10 py-10 sm:py-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-bold text-white">Ready to harmonize your workday?</h2>
              <p className="mt-3 text-sm sm:text-base text-white/85 max-w-2xl mx-auto">Create your company in 60 seconds. Invite your team. Watch attendance, time off and payroll come together — every day.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/signup"><button className="inline-flex items-center justify-center rounded-full bg-white text-[#004E72] hover:bg-zinc-100 px-8 h-11 font-medium">Create Company — Free <ArrowRight className="ml-2 h-4 w-4" /></button></Link>
                <Link to="/login"><button className="inline-flex items-center justify-center rounded-full bg-transparent border border-white/30 text-white hover:bg-white/10 px-8 h-11 font-medium">Sign In</button></Link>
              </div>
              <div className="mt-4 text-xs text-white/70">Free for up to 5 employees • No credit card • Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER - with subtle blobs ---------- */}
      <footer className="relative overflow-hidden border-t border-zinc-200 bg-[#F9F9F9]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-[6%] bottom-[-20%] w-[300px] h-[280px] bg-[#F8C5C0]/22 rounded-[60%_40%_50%_50%/50%_60%_40%_50%] opacity-60" />
          <div className="absolute -right-[8%] top-[-10%] w-[320px] h-[320px] bg-[#DDCFF2]/28 rounded-[40%_60%_50%_50%/60%_40%_50%_50%]" />
          <div className="absolute left-[30%] top-[20%] w-[480px] h-[180px] bg-[#C2E9DF]/20 rounded-[50%_50%_30%_70%/60%_40%_70%_30%] blur-[6px]" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <StafloIcon size={28} />
                <span className="font-logo text-lg text-zinc-900 dark:text-zinc-100">Staflo</span>
                <span className="text-xs text-zinc-500">• Every workday, perfectly aligned.</span>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">The complete HR platform for modern teams. Secure, reliable, and loved by HR leaders everywhere.</p>
              <div className="mt-4 text-xs text-zinc-500">© 2026 Staflo Technologies Pvt. Ltd. All rights reserved.</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li><a href="#features" className="hover:text-zinc-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-zinc-900">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-zinc-900">How it works</a></li>
                <li><Link to="/login" className="hover:text-zinc-900">Live Demo</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Resources</div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li><Link to="/help" className="hover:text-zinc-900">Help Center</Link></li>
                <li><Link to="/getting-started" className="hover:text-zinc-900">Getting Started Guide</Link></li>
                <li><Link to="/support" className="hover:text-zinc-900">Support</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Company</div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li><Link to="/about" className="hover:text-zinc-900">About</Link></li>
                <li><Link to="/contact" className="hover:text-zinc-900">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-zinc-900">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-zinc-900">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <span>Made with care for HR teams everywhere.</span>
            <span className="flex items-center gap-2">Secure • Reliable • Trusted by 2,400+ teams</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
