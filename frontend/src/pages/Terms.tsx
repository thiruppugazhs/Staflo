import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

export default function Terms(){
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#004E72] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold">Staflo</span></Link>
          <Link to="/signup" className="text-sm font-medium text-[#004E72]">Create Company</Link>
        </div>
      </header>
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-50 border border-zinc-200 px-3 py-1 text-xs"><FileText className="h-3.5 w-3.5 text-[#004E72]" /> Terms of Service</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mt-1">Effective: 22 August 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section><h2 className="font-semibold text-base">1. Agreement</h2><p className="text-zinc-600 mt-1">By creating a workspace or using Staflo, you agree to these Terms and our Privacy Policy.</p></section>
          <section><h2 className="font-semibold text-base">2. Workspaces</h2><p className="text-zinc-600 mt-1">Each company gets an isolated workspace. The creator is the initial Admin and may invite HR, Managers, and Employees. You are responsible for user access and invites you issue.</p></section>
          <section><h2 className="font-semibold text-base">3. Subscriptions</h2><p className="text-zinc-600 mt-1">Starter is free for up to 5 employees. Growth is ₹199/employee/month. Enterprise is custom. Prices exclude GST. You may cancel anytime; billing stops at period end.</p></section>
          <section><h2 className="font-semibold text-base">4. Acceptable use</h2><p className="text-zinc-600 mt-1">Do not use Staflo for unlawful purposes, to upload harmful content, or to attempt unauthorized access to other workspaces.</p></section>
          <section><h2 className="font-semibold text-base">5. Data ownership</h2><p className="text-zinc-600 mt-1">You own your company data. We act as a processor. On termination, you may request export for 30 days, after which data is securely deleted.</p></section>
          <section><h2 className="font-semibold text-base">6. Support & SLA</h2><p className="text-zinc-600 mt-1">Starter and Growth include standard support. Enterprise includes dedicated support and SLA as per your order form.</p></section>
          <section><h2 className="font-semibold text-base">7. Contact</h2><p className="text-zinc-600 mt-1">Legal: legal@staflo.io</p></section>
        </div>
      </div>
      <footer className="border-t border-zinc-200 bg-zinc-50"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 Staflo</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
