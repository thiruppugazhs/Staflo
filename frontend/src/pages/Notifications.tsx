import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../components/ui/toast'
import { useAuth } from '../stores/auth'
import { Bell, Mail, Send, RefreshCw, AlertTriangle, Info, CheckCircle2, MessageSquare, Phone, Users, UserCheck, ExternalLink } from 'lucide-react'

export default function Notifications(){
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'

  const [notifs, setNotifs] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Send form state
  const [recipientType, setRecipientType] = useState<'all'|'single'>('all')
  const [targetUserId, setTargetUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState<{email: boolean, whatsapp: boolean, sms: boolean, in_app: boolean}>({
    in_app: true,
    email: true,
    whatsapp: false,
    sms: false
  })
  const [priority, setPriority] = useState<'normal'|'urgent'>('normal')
  const [whatsappLinks, setWhatsappLinks] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const load = async()=>{
    setLoading(true)
    try{
      const {data}=await api.get('/notifications')
      setNotifs(data)
    }catch{
      setNotifs([])
    } finally{
      setLoading(false)
    }
  }

  const loadEmployees = async()=>{
    if (!isAdmin) return
    try {
      const { data } = await api.get('/users')
      setEmployees(data)
    } catch {}
  }

  useEffect(()=>{
    load()
    loadEmployees()
  },[])

  const toggleChannel = (ch: 'email'|'whatsapp'|'sms'|'in_app') => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }))
  }

  const handleSendNotification = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }

    const selectedChannels = Object.entries(channels)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)

    if (selectedChannels.length === 0) {
      toast.error('Select at least one delivery mode')
      return
    }

    setSending(true)
    setWhatsappLinks([])
    try{
      const { data } = await api.post('/notifications/send', {
        recipient_type: recipientType,
        user_id: recipientType === 'single' ? targetUserId : undefined,
        title: title.trim(),
        message: message.trim(),
        channels: selectedChannels,
        priority: priority
      })

      setTitle('')
      setMessage('')
      if (data.whatsapp_links?.length > 0) {
        setWhatsappLinks(data.whatsapp_links)
      }
      await load()
      toast.success(data.message || 'Notification broadcast sent successfully ✓')
    }catch(ex:any){
      toast.error(ex.response?.data?.detail || 'Failed to send notification')
    }finally{
      setSending(false)
    }
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
      announcement:'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    }
    return map[t]||map.info
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6 text-amber-500"/> Notifications & Broadcasts</h1>
          <p className="text-sm text-zinc-500 mt-1">Multi-channel delivery • Email (Resend) • WhatsApp • SMS • In-App</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/> Refresh
        </Button>
      </div>

      {isAdmin && (
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2 text-zinc-900 dark:text-white">
              <Send className="h-4 w-4 text-[#004E72]"/> Send Notification
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${priority === 'normal' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`text-xs px-2.5 py-1 rounded-md font-bold transition ${priority === 'urgent' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-950/40 text-red-600'}`}
              >
                🚨 Urgent
              </button>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audience Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Recipient Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType('all')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${recipientType === 'all' ? 'border-[#004E72] bg-sky-50 dark:bg-sky-950/40 text-[#004E72] dark:text-sky-300 font-bold' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    <Users className="h-3.5 w-3.5"/> All Employees ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('single')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${recipientType === 'single' ? 'border-[#004E72] bg-sky-50 dark:bg-sky-950/40 text-[#004E72] dark:text-sky-300 font-bold' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    <UserCheck className="h-3.5 w-3.5"/> Particular Employee
                  </button>
                </div>
              </div>

              {/* Single Employee Select */}
              {recipientType === 'single' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Select Employee</label>
                  <select
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium"
                  >
                    <option value="">Choose an employee…</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id}) — {emp.department || 'General'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col justify-end">
                  <p className="text-xs text-zinc-500">
                    Broadcast announcement will be delivered to all {employees.length} active company staff members.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Modes (Channels) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Delivery Modes (Select all that apply)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${channels.in_app ? 'border-[#004E72] bg-sky-50/50 dark:bg-sky-950/30 text-[#004E72] font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'}`}>
                  <input type="checkbox" checked={channels.in_app} onChange={() => toggleChannel('in_app')} className="rounded text-[#004E72]"/>
                  <Bell className="h-3.5 w-3.5"/> In-App Alert
                </label>

                <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${channels.email ? 'border-[#004E72] bg-sky-50/50 dark:bg-sky-950/30 text-[#004E72] font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'}`}>
                  <input type="checkbox" checked={channels.email} onChange={() => toggleChannel('email')} className="rounded text-[#004E72]"/>
                  <Mail className="h-3.5 w-3.5"/> Email (Resend)
                </label>

                <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${channels.whatsapp ? 'border-[#004E72] bg-sky-50/50 dark:bg-sky-950/30 text-[#004E72] font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'}`}>
                  <input type="checkbox" checked={channels.whatsapp} onChange={() => toggleChannel('whatsapp')} className="rounded text-[#004E72]"/>
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600"/> WhatsApp
                </label>

                <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition ${channels.sms ? 'border-[#004E72] bg-sky-50/50 dark:bg-sky-950/30 text-[#004E72] font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'}`}>
                  <input type="checkbox" checked={channels.sms} onChange={() => toggleChannel('sms')} className="rounded text-[#004E72]"/>
                  <Phone className="h-3.5 w-3.5 text-blue-600"/> Mobile SMS
                </label>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <Input
                placeholder="Notification Title (e.g. All-Hands Meeting at 4 PM / Holiday Notice)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="h-10 text-sm bg-white dark:bg-zinc-900 font-medium"
              />
              <textarea
                placeholder="Compose announcement or notice details..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#004E72]"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={sending} className="bg-[#004E72] hover:bg-[#092634] text-white text-xs gap-2 px-5 h-10">
                <Send className="h-3.5 w-3.5"/> {sending ? 'Dispatching Broadcast…' : 'Send Notification'}
              </Button>
            </div>
          </form>

          {whatsappLinks.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4"/> WhatsApp Dispatch Links Ready ({whatsappLinks.length})
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                Click below to open WhatsApp pre-filled with this message for instant delivery:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {whatsappLinks.map((w, idx) => (
                  <a
                    key={idx}
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                  >
                    Open Chat with {w.name} ({w.phone}) <ExternalLink className="h-3 w-3"/>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Notification Filter & Feed */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter:</span>
        {['all','announcement','info','success','warning','error'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition ${filter===f ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>{f}</button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">{filtered.length} / {notifs.length} notifications</span>
      </div>

      <div className="space-y-3">
        {filtered.length===0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/>
            <div className="mt-3 font-medium">No notifications</div>
            <div className="text-sm text-zinc-500">Invite an employee or send a broadcast to generate alerts.</div>
            <Button variant="outline" size="sm" onClick={load} className="mt-4">Reload</Button>
          </Card>
        ) : filtered.map((n:any)=>(
          <Card key={n.id} className={`p-4 flex gap-3 hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition ${n.priority === 'urgent' ? 'border-l-4 border-l-red-500 bg-red-50/20' : ''}`}>
            <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              {typeIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">{n.title}</span>
                {n.priority === 'urgent' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">URGENT</span>}
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

