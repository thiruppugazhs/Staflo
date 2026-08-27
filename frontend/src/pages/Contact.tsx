import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function Contact(){
  const [sent,setSent]=useState(false)
  return (
    <div className="min-h-screen bg-[#FFFBF7] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#eab308] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold text-[18px]">DailyFlow</span></Link>
          <Link to="/signup"><button className="inline-flex items-center justify-center rounded-full h-8 px-5 text-sm font-medium bg-[#eab308] text-white">Create Company <ArrowRight className="ml-1.5 h-4 w-4" /></button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute -left-[10%] top-[10%] w-[360px] h-[360px] bg-[#C2E9DF]/30 rounded-[50%_40%_60%_50%] opacity-60" /><div className="absolute -right-[10%] -top-[10%] w-[380px] h-[380px] bg-[#DDCFF2]/30 rounded-[40%_60%_45%_55%] opacity-60" /></div>
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs shadow-sm"><MessageCircle className="h-3.5 w-3.5 text-[#eab308]" /> Contact</div>
            <h1 className="mt-3 text-[34px] sm:text-[42px] font-bold tracking-tight">We’re here to help</h1>
            <p className="mt-3 text-sm text-zinc-600 max-w-[600px]">Talk to our team — whether you’re evaluating DailyFlow, need help with setup, or want to discuss enterprise needs.</p>
          </div>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mt-8">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              {!sent ? (
                <form onSubmit={e=>{e.preventDefault(); setSent(true)}} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-medium">Full name</label><input required className="mt-1 w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm" placeholder="Aarav Sharma" /></div>
                    <div><label className="text-xs font-medium">Work email</label><input required type="email" className="mt-1 w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm" placeholder="aarav@company.com" /></div>
                  </div>
                  <div><label className="text-xs font-medium">Company</label><input className="mt-1 w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm" placeholder="Olive Systems Pvt. Ltd." /></div>
                  <div><label className="text-xs font-medium">Message</label><textarea required rows={4} className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm" placeholder="Tell us how we can help..." /></div>
                  <button className="w-full inline-flex items-center justify-center h-10 rounded-full bg-[#eab308] text-white text-sm font-medium"><Send className="mr-2 h-4 w-4" /> Send message</button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">✓</div>
                  <h3 className="mt-3 font-semibold">Message sent</h3>
                  <p className="text-sm text-zinc-600 mt-1">We’ll reply within 4 hours on business days.</p>
                  <Link to="/" className="mt-4 inline-flex text-sm text-[#eab308] font-medium">Back to home →</Link>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold">Reach us directly</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex gap-3"><Mail className="h-4 w-4 text-zinc-500 mt-0.5" /><span>support@dayflow.com<br/><span className="text-xs text-zinc-500">Response within 4 hours</span></span></div>
                  <div className="flex gap-3"><Phone className="h-4 w-4 text-zinc-500 mt-0.5" /><span>+91 80 1234 5678<br/><span className="text-xs text-zinc-500">Mon–Fri, 9am–6pm IST</span></span></div>
                  <div className="flex gap-3"><MapPin className="h-4 w-4 text-zinc-500 mt-0.5" /><span>DailyFlow Technologies Pvt. Ltd.<br/> Koramangala, Bengaluru 560034, India</span></div>
                  <div className="flex gap-3"><Clock className="h-4 w-4 text-zinc-500 mt-0.5" /><span>Average reply: 2h 18m</span></div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#eab308] text-white p-6">
                <h3 className="font-semibold">Need enterprise support?</h3>
                <p className="text-sm text-white/80 mt-1">Dedicated onboarding, SLA, and on-premise options.</p>
                <a href="mailto:sales@dayflow.com" className="mt-3 inline-flex text-sm font-medium underline">sales@dayflow.com →</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-zinc-200 bg-white"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 DailyFlow</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
