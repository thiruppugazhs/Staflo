import { Link } from 'react-router-dom'
import { Search, BookOpen, Users, Wallet, CalendarCheck, Clock, ShieldCheck, MessageCircle, ArrowRight, HelpCircle } from 'lucide-react'
import { useState } from 'react'

const cats = [
  {icon: Users, title:'People & Directory', count:12, desc:'Add, invite, and manage employees'},
  {icon: Clock, title:'Attendance', count:9, desc:'Check-in, hours, and status'},
  {icon: CalendarCheck, title:'Time Off', count:11, desc:'Leave types, balances, approvals'},
  {icon: Wallet, title:'Payroll', count:14, desc:'Components, payslips, and runs'},
  {icon: ShieldCheck, title:'Security & Access', count:8, desc:'Roles, privacy, and workspace isolation'},
  {icon: BookOpen, title:'Getting Started', count:6, desc:'First-day setup and onboarding'},
]

const faqs = [
  {q:'How do I create my company workspace?', a:'Click Create Company, enter your company name and admin details. Your workspace is ready in under a minute.'},
  {q:'How do invites work?', a:'Admins invite by email. Teammates receive a secure link and set their own password. No self-registration sprawl.'},
  {q:'Is my data isolated from other companies?', a:'Yes. Every workspace is fully separate and private — isolated by design, not just by filter.'},
  {q:'Can I customize payroll components?', a:'Yes. Add earnings and deductions, set formulas, and DailyFlow calculates accurate breakdowns for each person.'},
]

export default function HelpCenter(){
  const [query,setQuery]=useState('')
  const filtered = cats.filter(c=> c.title.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#eab308] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold">DailyFlow</span><span className="text-xs text-zinc-500 ml-1 hidden sm:inline">Help Center</span></Link>
          <Link to="/contact"><button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#eab308] text-white">Contact Support <ArrowRight className="ml-1.5 h-4 w-4" /></button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-br from-[#eab308] via-[#7a5771] to-[#b45309] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
        <div className="relative mx-auto max-w-[720px] px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs"><HelpCircle className="h-3.5 w-3.5" /> How can we help?</div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Answers, right when you need them</h1>
          <p className="mt-3 text-sm text-white/80">Search guides, tutorials, and best practices from the DailyFlow team.</p>
          <div className="mt-6 relative max-w-[560px] mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search help — e.g., payroll, attendance, leave" className="w-full h-11 rounded-full bg-white text-zinc-900 pl-10 pr-4 text-sm shadow-lg placeholder:text-zinc-500" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c=>(
            <div key={c.title} className="rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-md transition shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center"><c.icon className="h-5 w-5 text-[#eab308]" /></div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="text-sm text-zinc-600 mt-1">{c.desc}</p>
              <div className="mt-3 text-xs text-zinc-500">{c.count} articles</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid lg:grid-cols-[1.6fr_0.9fr] gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Popular questions</h2>
            <div className="mt-4 space-y-3">
              {faqs.map(f=>(
                <details key={f.q} className="group rounded-xl border border-zinc-200 bg-zinc-50 open:bg-white px-4 py-3">
                  <summary className="list-none flex items-center justify-between cursor-pointer text-sm font-medium">{f.q}<span className="text-zinc-400 group-open:rotate-180 transition">⌃</span></summary>
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200 p-6 h-fit">
            <MessageCircle className="h-6 w-6 text-[#eab308]" />
            <h3 className="font-semibold mt-3">Still need help?</h3>
            <p className="text-sm text-zinc-600 mt-1">Our support team replies in under 4 hours on business days.</p>
            <Link to="/contact" className="mt-4 inline-flex items-center justify-center w-full h-10 rounded-full bg-[#eab308] text-white text-sm font-medium">Contact Support</Link>
            <Link to="/getting-started" className="mt-2 inline-flex items-center justify-center w-full h-10 rounded-full border border-zinc-200 bg-white text-sm font-medium">View Getting Started Guide</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 DailyFlow</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
