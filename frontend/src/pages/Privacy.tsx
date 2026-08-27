import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function Privacy(){
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-[#004E72] flex items-center justify-center font-bold text-sm text-white">DF</div><span className="font-bold">DailyFlow</span></Link>
          <Link to="/signup" className="text-sm font-medium text-[#004E72]">Create Company</Link>
        </div>
      </header>
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-50 border border-zinc-200 px-3 py-1 text-xs"><ShieldCheck className="h-3.5 w-3.5 text-[#004E72]" /> Privacy Policy</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mt-1">Last updated: 22 August 2026 • DailyFlow Technologies Pvt. Ltd.</p>
        <div className="prose prose-zinc max-w-none mt-8 space-y-6 text-sm leading-relaxed">
          <p>At DailyFlow, your trust is our foundation. We build HR software that handles sensitive people data, so privacy is not a feature — it’s the core of our design.</p>
          <h2 className="text-lg font-semibold">1. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1"><li>Company and workspace information you provide during signup.</li><li>Employee profiles, attendance, leave and payroll data you create.</li><li>Authentication data (email, login ID) and device information for security.</li></ul>
          <h2 className="text-lg font-semibold">2. How we use it</h2>
          <p>To provide the DailyFlow service, secure your workspace, and improve reliability. We never sell your data. Aggregated, anonymized analytics may be used to improve performance.</p>
          <h2 className="text-lg font-semibold">3. Data isolation</h2>
          <p>Every company’s data is isolated by workspace. You control who sees what — role-based access ensures sensitive fields like salary are visible only to Admin/HR.</p>
          <h2 className="text-lg font-semibold">4. Storage & security</h2>
          <p>Data is stored in secure, encrypted infrastructure (Supabase Postgres with row-level isolation). We apply encryption in transit and at rest, and maintain audit logging.</p>
          <h2 className="text-lg font-semibold">5. Your rights</h2>
          <p>You may request export or deletion of your workspace data by contacting support@dayflow.com. We respond within 7 days.</p>
          <h2 className="text-lg font-semibold">6. Contact</h2>
          <p>Questions? Write to <span className="font-medium">privacy@dayflow.com</span>.</p>
        </div>
      </div>
      <footer className="border-t border-zinc-200 bg-zinc-50"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 text-xs text-zinc-500 flex justify-between"><span>© 2026 DailyFlow</span><Link to="/" className="hover:text-zinc-700">← Back to home</Link></div></footer>
    </div>
  )
}
