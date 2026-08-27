import { Link } from 'react-router-dom'
import { Check, Play, Building2, UserPlus, Wallet, ArrowRight, BookOpen, Clock } from 'lucide-react'

export default function GettingStarted(){
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#eab308] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold">DailyFlow</span><span className="text-xs text-zinc-500 ml-2 hidden sm:inline">Getting Started</span></Link>
          <Link to="/signup"><button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#eab308] text-white">Start Free <ArrowRight className="ml-1.5 h-4 w-4" /></button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs shadow-sm"><BookOpen className="h-3.5 w-3.5 text-[#eab308]" /> Getting Started Guide</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">From zero to payroll in 15 minutes</h1>
        <p className="mt-3 text-sm text-zinc-600 max-w-2xl">Follow this short guide. No training needed — DailyFlow walks you through each step.</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500"><Clock className="h-3.5 w-3.5" /> 3 steps • ~15 minutes • No credit card</div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {step:'01', icon: Building2, title:'Create your workspace', time:'2 min', desc:'Sign up with your company name and admin details. Your private workspace is ready instantly.', bullets:['Add company name & logo','Confirm admin profile','Workspace is isolated & secure'], cta:'Create Company'},
            {step:'02', icon: UserPlus, title:'Invite your team', time:'5 min', desc:'Add teammates by email. They get a secure invite and join in one click.', bullets:['Invite by email','Set role: Admin / HR / Employee','Teammates verify and sign in'], cta:'Invite Guide'},
            {step:'03', icon: Wallet, title:'Run attendance & payroll', time:'8 min', desc:'Your team checks in daily, you approve time off, and payroll runs with a clear breakdown.', bullets:['One-tap check-in','Approve leaves','Run payroll & share payslips'], cta:'Payroll Overview'},
          ].map(s=>(
            <div key={s.step} className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#eab308] text-white flex items-center justify-center"><s.icon className="h-5 w-5" /></div>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-50 border border-zinc-200">{s.time}</span>
              </div>
              <div className="text-xs tracking-widest font-semibold text-[#eab308] mt-4">STEP {s.step}</div>
              <h3 className="font-semibold mt-1">{s.title}</h3>
              <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{s.desc}</p>
              <ul className="mt-4 space-y-1.5 flex-1">
                {s.bullets.map(b=> <li key={b} className="flex gap-2 text-xs text-zinc-700"><Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" /> {b}</li>)}
              </ul>
              <Link to="/signup" className="mt-4 text-sm font-medium text-[#eab308] flex items-center gap-1">{s.cta} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2"><Play className="h-4 w-4 text-[#eab308]" /> Watch: DailyFlow in 60 seconds</h3>
            <p className="text-sm text-zinc-600 mt-1">See how leaders set up DailyFlow, invite a team, and run the first payroll.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-500">▶ This is a placeholder video — connect your demo link in /login.</div>
          </div>
          <div className="w-full lg:w-[360px] aspect-video rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
            <div className="h-12 w-12 rounded-full bg-[#eab308] text-white flex items-center justify-center"><Play className="h-5 w-5 ml-0.5" /></div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#eab308] text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div><h3 className="font-semibold">Ready to start?</h3><p className="text-sm text-white/80">Create your company — free for up to 5 employees.</p></div>
          <Link to="/signup"><button className="inline-flex items-center justify-center rounded-full bg-white text-[#eab308] px-6 h-10 font-medium">Create Company — Free <ArrowRight className="ml-2 h-4 w-4" /></button></Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 DailyFlow</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
