import { Link } from 'react-router-dom'
import { Building2, Users, ShieldCheck, Sparkles, ArrowRight, Heart, Target, Eye } from 'lucide-react'

export default function About(){
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-zinc-900 selection:bg-[#004E72]/15">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="DailyFlow logo" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-[18px] tracking-tight">DailyFlow</span>
          </Link>
          <Link to="/signup"><button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#004E72] text-white hover:bg-[#FF6E42]">Create Company <ArrowRight className="ml-1.5 h-4 w-4" /></button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[12%] -left-[10%] w-[420px] h-[420px] bg-[#FDF0E2] rounded-[60%_40%_55%_45%] opacity-70" />
          <div className="absolute -top-[8%] -right-[10%] w-[380px] h-[320px] bg-[#DDCFF2]/35 rounded-[40%_60%_45%_55%] opacity-60" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs text-zinc-600 shadow-sm"><Building2 className="h-3.5 w-3.5 text-[#004E72]" /> About DailyFlow</div>
            <h1 className="mt-4 text-[36px] sm:text-[46px] font-bold tracking-tight leading-[0.95] text-zinc-900">People operations,<br/><span className="text-[#FF6E42]">perfectly aligned.</span></h1>
            <p className="mt-4 text-[16px] leading-relaxed text-zinc-600 max-w-[640px]">DailyFlow was built for leaders who believe HR should be clear, calm, and confident. We help growing teams manage people, time, and pay — without complexity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              {icon: Target, title:'Our Mission', desc:'Give every growing business the same operational clarity that great enterprises have — simple, reliable, and human.'},
              {icon: Eye, title:'Our Vision', desc:'A workday where leaders trust their numbers, teams feel valued, and HR is a strategic advantage.'},
              {icon: Heart, title:'Our Promise', desc:'Secure, private, and thoughtfully designed. Your people’s data is treated with the care it deserves.'},
            ].map(c=>(
              <div key={c.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-[#004E72]/10 flex items-center justify-center"><c.icon className="h-5 w-5 text-[#004E72]" /></div>
                <h3 className="mt-4 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#004E72]"><Sparkles className="h-3.5 w-3.5" /> OUR STORY</div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 max-w-3xl">Founded in Bengaluru in 2024, DailyFlow began as a simple idea: HR software should feel like a calm, well-run office — not a maze of spreadsheets. Today we support 2,400+ teams who run attendance, leave and payroll on DailyFlow every day. We’re a small team obsessed with reliability, privacy, and craft.</p>
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4"><div className="text-2xl font-bold">2,400+</div><div className="text-xs text-zinc-500">teams worldwide</div></div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4"><div className="text-2xl font-bold">99.9%</div><div className="text-xs text-zinc-500">uptime commitment</div></div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4"><div className="text-2xl font-bold">4.9/5</div><div className="text-xs text-zinc-500">customer rating</div></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <span>© 2026 DailyFlow Technologies Pvt. Ltd.</span>
          <Link to="/" className="hover:text-zinc-700">← Back to home</Link>
        </div>
      </footer>
    </div>
  )
}
