import { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { useToast } from '../components/ui/toast'
import { Info, Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react'

export default function TimeOff(){
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role==='admin' || user?.role==='hr'
  const [myLeaves,setMyLeaves]=useState<any[]>([])
  const [queue,setQueue]=useState<any[]>([])
  const [balances,setBalances]=useState<any>(null)
  const [form,setForm]=useState({type:'paid', start_date:'', end_date:'', reason:'', doc_url:''})
  const [msg,setMsg]=useState('')
  const [dragOver,setDragOver]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [fileName,setFileName]=useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMy = async()=>{
    const {data}=await api.get('/leave/my')
    setMyLeaves(data)
    try{ const b=await api.get('/leave/balances'); setBalances(b.data)}catch{}
  }
  const loadQueue = async()=>{
    if(!isAdmin) return
    const {data}=await api.get('/leave/queue')
    setQueue(data)
  }
  useEffect(()=>{ loadMy(); loadQueue() },[])

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg('')
    try{
      await api.post('/leave/request', form)
      setMsg('Request submitted — Pending approval')
      setForm({type:'paid', start_date:'', end_date:'', reason:'', doc_url:''})
      loadMy()
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Failed')}
  }

  function resolveFileUrl(url?: string){
    if(!url) return '#'
    if(url.startsWith('http://') || url.startsWith('https://')) return url
    if(url.startsWith('/uploads')){
      const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
      return `${base}${url}`
    }
    return url
  }

  const decide = async(id:string, action:'approve'|'reject')=>{
    try{
      await api.post(`/leave/${id}/${action}`, {comment: action})
      toast.success(`Leave request ${action==='approve' ? 'approved' : 'rejected'} ✓`)
      loadQueue()
    }catch(ex:any){ toast.error(ex.response?.data?.detail || `Failed to ${action} leave request`) }
  }

  const uploadFile = async(file: File)=>{
    if(!file) return
    if(file.size > 10 * 1024 * 1024){ setMsg('File too large — max 10MB'); return }
    setUploading(true); setMsg(''); setFileName(file.name)
    try{
      const fd = new FormData()
      fd.append('file', file)
      // reuse employee document bucket — requires user_id
      const {data} = await api.post(`/documents/upload/${user?.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = data.file_url || data.url || ''
      setForm(f=>({...f, doc_url: url}))
      setMsg(`Uploaded ${file.name} — attached to request`)
    }catch(e:any){
      setMsg(e.response?.data?.detail || 'Upload failed — you can paste a URL manually')
    }finally{ setUploading(false) }
  }
  const onDrop = (e: React.DragEvent)=>{
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if(f) uploadFile(f)
  }
  const onPick = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0]
    if(f) uploadFile(f)
    // reset so same file can be picked again
    if(fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Time Off</h1>
      {balances && <div className="text-sm text-zinc-400">Balances — Paid: {balances.paid_remaining} days • Sick: {balances.sick_remaining} days • Unpaid taken: {balances.unpaid_taken}</div>}

      {isAdmin ? (
        <Card className="overflow-auto">
          <div className="p-3 flex justify-between items-center">
            <h3 className="font-semibold">Leave Queue — Admin/HR (All Employees)</h3>
            <Button size="sm" variant="outline" onClick={loadQueue}>Refresh</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs"><tr><th className="text-left p-2">Employee</th><th className="text-left p-2">Type</th><th className="text-left p-2">Start</th><th className="text-left p-2">End</th><th className="text-left p-2">Days</th><th className="text-left p-2">Status</th><th className="text-left p-2">Action</th></tr></thead>
            <tbody>
              {queue.map(q=>(
                <tr key={q.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-2"><div className="font-medium">{q.name}</div><div className="text-xs text-zinc-500">{q.employee_id}</div></td>
                  <td className="p-2">{q.type}</td>
                  <td className="p-2">{q.start_date}</td>
                  <td className="p-2">{q.end_date}</td>
                  <td className="p-2">{q.days}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.status==='pending'?'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200': q.status==='approved'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200':'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'}`}>{q.status}</span></td>
                  <td className="p-2 flex gap-1">{q.status==='pending' && <><Button size="sm" onClick={()=>decide(q.id,'approve')}>Approve</Button><Button size="sm" variant="outline" onClick={()=>decide(q.id,'reject')}>Reject</Button></>}</td>
                </tr>
              ))}
              {queue.length===0 && <tr><td colSpan={7} className="p-6 text-center text-zinc-500">No leave requests</td></tr>}
            </tbody>
          </table>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">My Time Off — Calendar View</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Array.from({length:12}).map((_,i)=>{
              const month = new Date(0,i).toLocaleString('default',{month:'short'})
              const monthLeaves = myLeaves.filter(l=>{
                const d = new Date(l.start_date)
                return d.getMonth()===i
              })
              return (
                <div key={i} className="border border-zinc-200 dark:border-zinc-800 rounded p-2 bg-zinc-50 dark:bg-zinc-900/30">
                  <div className="font-medium">{month}</div>
                  {monthLeaves.map(l=>(
                    <div key={l.id} className={`mt-1 px-1 py-0.5 rounded text-[10px] font-medium text-white ${l.status==='pending'?'bg-amber-500': l.status==='approved'?'bg-emerald-600':'bg-red-600'}`}>{l.start_date.slice(5)} → {l.end_date.slice(5)} {l.type}</div>
                  ))}
                </div>
              )
            })}
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">My Requests</h4>
            {myLeaves.map(l=>(
              <div key={l.id} className="flex justify-between items-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-sm bg-white dark:bg-zinc-900/50">
                <div>{l.start_date} → {l.end_date} • <span className="capitalize">{l.type}</span> • {l.days}d</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${l.status==='pending'?'bg-amber-500': l.status==='approved'?'bg-emerald-600':'bg-red-600'}`}>{l.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3 h-fit">
          <h3 className="font-semibold">Time-off Type Request</h3>
          <form onSubmit={submit} className="space-y-3">
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
              <option value="paid">Paid Time Off</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            <div>
              <label className="text-xs text-zinc-500">Validity Period</label>
              <div className="flex gap-2">
                <Input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} required/>
                <Input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} required/>
              </div>
            </div>
            <Input placeholder="Reason / description" value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})}/>
            {/* Drag & drop / file opener — replaces plain Doc URL input */}
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Medical certificate / attachment</label>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={onPick} />
              <div
                onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={onDrop}
                onClick={()=>fileInputRef.current?.click()}
                className={`mt-1.5 group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition
                  ${dragOver ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-zinc-900'}`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Uploading {fileName}…</span>
                  </>
                ) : form.doc_url ? (
                  <>
                    <span className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" /></span>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-full">{fileName || 'Document attached'}</span>
                    <span className="text-xs text-zinc-500 truncate max-w-full">{form.doc_url}</span>
                    <span className="text-xs text-violet-600 dark:text-violet-400 underline">Click or drop to replace</span>
                  </>
                ) : (
                  <>
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center border ${dragOver ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 group-hover:text-violet-600'}`}>
                      <Upload className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Drag & drop or <span className="text-violet-600 dark:text-violet-400 underline">click to browse</span></span>
                      <div className="text-xs text-zinc-500 mt-0.5">PDF, JPG, PNG, DOC — max 10MB • optional for sick &gt;2 days</div>
                    </div>
                  </>
                )}
              </div>
              {form.doc_url && !uploading && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-2">
                  <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-xs truncate flex-1 text-zinc-700 dark:text-zinc-300">{form.doc_url}</span>
                  <a href={resolveFileUrl(form.doc_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 dark:text-violet-400 hover:underline shrink-0">Open</a>
                  <button type="button" onClick={()=>{setForm(f=>({...f, doc_url:''})); setFileName(''); setMsg('Attachment removed')}} className="h-6 w-6 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center shrink-0"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {/* fallback paste */}
              <div className="mt-2 flex gap-2">
                <Input placeholder="Or paste Doc URL manually" value={form.doc_url} onChange={e=>setForm({...form, doc_url:e.target.value})} className="text-xs h-8" />
                {form.doc_url && <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={()=>{setForm(f=>({...f, doc_url:''})); setFileName('')}}><X className="h-3 w-3" /></Button>}
              </div>
            </div>
            <div className="text-xs text-zinc-500">Types: Paid • Sick • Unpaid | Paid 24 days / Sick 7 days per year.</div>
            <Button type="submit" className="w-full">Request</Button>
            {msg && <div className="text-sm p-2.5 rounded-xl bg-violet-50 dark:bg-zinc-900 border border-violet-200 dark:border-zinc-800 text-violet-700 dark:text-zinc-200">{msg}</div>}
          </form>
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/30 p-3 flex gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-white dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            </span>
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-violet-900 dark:text-violet-100">Note</div>
              <div className="text-violet-700 dark:text-violet-300/80 mt-0.5">Employees can only see their own time-off records, while Admins and HR Officers can view & approve/reject for all employees.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
