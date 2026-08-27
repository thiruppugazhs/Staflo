import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/toast'
import { Bell, Mail, Send, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

export default function Notifications(){
  const toast = useToast()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testTitle, setTestTitle] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [filter, setFilter] = useState('all')

  const load = async()=>{
    setLoading(true)
    try{ const {data}=await api.get('/notifications'); setNotifs(data) }catch{ setNotifs([]) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const sendTest = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!testTitle || !testMsg) return
    try{
      await api.post('/notifications/test', {title: testTitle, message: testMsg})
      setTestTitle(''); setTestMsg('')
      await load()
      toast.success('Test notification sent ✓')
    }catch(ex:any){ toast.error(ex.response?.data?.detail || 'Failed to send notification') }
  }

  const filtered = notifs.filter(n=>{
    if(filter==='all') return true
    return n.type===filter
  })

  const typeIcon = (t:string)=>{
    if(t==='success') return <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
    if(t==='warning') return <AlertTriangle className="h-4 w-4 text-amber-500"/>
    if(t==='error') return <AlertTriangle className="h-4 w-4 text-red-500"/>
    return <Info className="h-4 w-4 text-sky-500"/>
  }

  const typeBadge = (t:string)=>{
    const map:Record<string,string>={
      info:'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      success:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      error:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    }
    return map[t]||map.info
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6 text-amber-500"/> Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">System alerts • Invite / leave / payroll events • Real email via Brevo SMTP • `GET /notifications`</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/> Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2"><Mail className="h-4 w-4"/> Email Alerts (Live SMTP)</h3>
          <p className="text-xs text-zinc-500 mt-1">Notifications with a recipient are delivered for real via Brevo SMTP (`send_email`). Use `POST /notifications/test` to send one to your own inbox.</p>
          <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
            Invite, leave approve/reject, and payroll updates auto-create notifications for the company.
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4"/> Send Test Notification</h3>
          <form onSubmit={sendTest} className="mt-3 flex flex-col sm:flex-row gap-2">
            <Input placeholder="Title (e.g. Test Alert)" value={testTitle} onChange={e=>setTestTitle(e.target.value)} className="flex-1 bg-white dark:bg-zinc-900"/>
            <Input placeholder="Message" value={testMsg} onChange={e=>setTestMsg(e.target.value)} className="flex-[2] bg-white dark:bg-zinc-900"/>
            <Button type="submit" size="sm" className="shrink-0 gap-1.5"><Send className="h-3.5 w-3.5"/> Send</Button>
          </form>
          <p className="text-xs text-zinc-500 mt-2">Calls `POST /notifications/test` — visible to all users in same company.</p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter:</span>
        {['all','info','success','warning','error'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition ${filter===f ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>{f}</button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">{filtered.length} / {notifs.length} notifications</span>
      </div>

      <div className="space-y-3">
        {filtered.length===0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/>
            <div className="mt-3 font-medium">No notifications</div>
            <div className="text-sm text-zinc-500">Invite an employee or create a leave request to generate alerts.</div>
            <Button variant="outline" size="sm" onClick={load} className="mt-4">Reload</Button>
          </Card>
        ) : filtered.map((n:any)=>(
          <Card key={n.id} className="p-4 flex gap-3 hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              {typeIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{n.title}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${typeBadge(n.type)}`}>{n.type}</span>
                <span className="text-xs text-zinc-500">• {new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{n.message}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
