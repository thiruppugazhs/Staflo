import { Link } from 'react-router-dom'
import { LifeBuoy, Mail, MessageCircle, Clock, ShieldCheck, BookOpen, Phone, Check } from 'lucide-react'

export default function Support(){
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#004E72] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold">Staflo</span><span className="text-xs text-zinc-500 ml-2 hidden sm:inline">Support</span></Link>
          <Link to="/contact" className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium border border-zinc-200 bg-white">Contact Us</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs shadow-sm"><LifeBuoy className="h-3.5 w-3.5 text-[#004E72]" /> Support</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Help, when you need it</h1>
        <p className="mt-3 text-sm text-zinc-600 max-w-2xl">Staflo is built to be intuitive, but our team is always nearby. Choose the channel that works for you.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <MessageCircle className="h-6 w-6 text-[#004E72]" />
            <h3 className="font-semibold mt-3">Chat & Email</h3>
            <p className="text-sm text-zinc-600 mt-1">Fast, human responses — no bots.</p>
            <div className="mt-3 text-sm"><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-zinc-500" /> support@staflo.io</div><div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Avg. reply 2h 18m • Business days</div></div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <BookOpen className="h-6 w-6 text-[#004E72]" />
            <h3 className="font-semibold mt-3">Help Center</h3>
            <p className="text-sm text-zinc-600 mt-1">Guides, FAQs, and best practices.</p>
            <Link to="/help" className="mt-3 inline-flex text-sm font-medium text-[#004E72]">Browse articles →</Link>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <Phone className="h-6 w-6 text-[#004E72]" />
            <h3 className="font-semibold mt-3">Enterprise & Sales</h3>
            <p className="text-sm text-zinc-600 mt-1">Dedicated onboarding and SLA.</p>
            <div className="mt-3 text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-zinc-500" /> sales@staflo.io</div>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="font-semibold">What we promise</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Response within 4 hours on business days</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Your data stays in your private workspace — support never accesses without consent</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Clear status updates at status.staflo.io</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" /> Prioritized help for Growth & Enterprise</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#004E72] to-[#092634] text-white p-6">
            <ShieldCheck className="h-6 w-6 text-white/90" />
            <h3 className="font-semibold mt-3">Your workspace is protected</h3>
            <p className="text-sm text-white/80 mt-1">Support is provided over secure channels. We verify workspace ownership before assisting with access or billing.</p>
            <div className="mt-4 text-xs text-white/70">Hours: Mon–Fri, 9am–6pm IST • Emergency: enterprise customers via dedicated channel</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 Staflo</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
