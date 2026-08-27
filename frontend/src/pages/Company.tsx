import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { Building2, Globe, Calendar, Users, Image as ImageIcon, Shield } from 'lucide-react'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

export default function Company(){
  const { user } = useAuth()
  const isAdmin = user?.role==='admin' || user?.role==='hr'
  const [company, setCompany] = useState<any>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [logoFile, setLogoFile] = useState<File|null>(null)
  const [logoPreview, setLogoPreview] = useState<string|null>(null)
  const [uploading, setUploading] = useState(false)
  const [empCount, setEmpCount] = useState<number | null>(null)

  const load = async()=>{
    try{ const {data}=await api.get('/companies/me'); setCompany(data); setName(data.name)}catch(e:any){ setMsg(e.response?.data?.detail||'Failed to load company')}
    try{ const {data}=await api.get('/users'); setEmpCount(data.length)}catch{}
  }
  useEffect(()=>{ load() },[])

  const saveName = async()=>{
    setMsg('')
    try{ const {data}=await api.patch('/companies/me', {name}); setCompany(data); setMsg('Company name updated')} catch(e:any){ setMsg(e.response?.data?.detail||'Failed')}
  }
  const handleFileChange = (f: File | null)=>{
    setLogoFile(f)
    if(f){
      if(f.size > 2*1024*1024){ setMsg('Logo must be <2MB'); setLogoFile(null); setLogoPreview(null); return }
      if(!f.type.startsWith('image/')){ setMsg('Only image files allowed'); setLogoFile(null); setLogoPreview(null); return }
      setLogoPreview(URL.createObjectURL(f)); setMsg('')
    } else { setLogoPreview(null)}
  }
  const uploadLogo = async()=>{
    if(!logoFile) return setMsg('Pick an image file first — click Choose File')
    setUploading(true); setMsg('')
    const fd=new FormData(); fd.append('file', logoFile)
    try{
      const {data}=await api.post('/companies/logo', fd)
      setCompany((c:any)=> ({...c, logo_url:data.logo_url}))
      setMsg('Logo uploaded ✓')
      setLogoFile(null); setLogoPreview(null)
      const el = document.getElementById('logo-input-company') as HTMLInputElement | null
      if(el) el.value=''
    } catch(e:any){
      const detail = e.response?.data?.detail
      if(Array.isArray(detail)) setMsg(detail.map((d:any)=> d.msg || JSON.stringify(d)).join(', '))
      else if(typeof detail==='string') setMsg(detail)
      else setMsg(e.response?.data?.message || e.message || 'upload failed')
    } finally{ setUploading(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-6 w-6 text-[#004E72]"/> Company</h1>
        <p className="text-sm text-zinc-500 mt-1">Your organization's profile and branding.</p>
      </div>

      {!company ? (
        <Card className="p-8 text-center text-sm text-zinc-500">Loading company...</Card>
      ) : (
        <>
          {/* Hero card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#004E72] to-[#9B6B8A] flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden border border-white/20">
                {company.logo_url ? <img src={resolveFileUrl(company.logo_url)} alt="logo" className="h-full w-full object-contain bg-white p-1"/> : <Building2 className="h-10 w-10"/>}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{company.name}</h2>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><Globe className="h-3 w-3"/> slug: <b>{company.slug}</b></span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"><Users className="h-3 w-3"/> {empCount ?? '—'} employees</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><Calendar className="h-3 w-3"/> Created {company.created_at ? new Date(company.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div className="mt-2 text-xs text-zinc-500">ID: <span className="font-mono">{company.id}</span> • Your role: <span className="capitalize font-medium text-violet-600 dark:text-violet-400">{user?.role}</span> {isAdmin ? <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px]"><Shield className="h-3 w-3"/> Admin</span> : null}</div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 md:items-start">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4"/> Company Details</h3>
              <div>
                <label className="text-sm">Company Name</label>
                <div className="flex gap-2 mt-1">
                  <Input value={name} onChange={e=>setName(e.target.value)} disabled={!isAdmin} className="bg-white dark:bg-zinc-900"/>
                  <Button onClick={saveName} disabled={!isAdmin}>Save</Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">A short slug is auto-generated from the name.</p>
              </div>
              {!isAdmin && <div className="text-xs text-amber-600 dark:text-amber-400">Only admin/hr can edit company name.</div>}
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Company Logo</h3>
              {company.logo_url && <img src={resolveFileUrl(company.logo_url)} alt="logo" className="h-20 border border-zinc-200 dark:border-zinc-800 rounded-lg object-contain bg-white p-2"/>}
              {logoPreview && <img src={logoPreview} alt="preview" className="h-20 border border-violet-300 rounded-lg object-contain bg-white p-2"/>}
              <div className="flex flex-wrap items-center gap-2">
                <input id="logo-input-company" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>handleFileChange(e.target.files?.[0]||null)} className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:text-white file:text-xs hover:file:bg-zinc-800 dark:file:bg-zinc-700 file:cursor-pointer" disabled={!isAdmin}/>
                <Button size="sm" variant="outline" onClick={uploadLogo} disabled={!isAdmin || !logoFile || uploading}>{uploading ? 'Uploading…' : 'Upload Logo'}</Button>
              </div>
              {logoFile && <div className="text-xs text-zinc-500">{logoFile.name} • {(logoFile.size/1024).toFixed(0)}KB • Click Upload Logo to save.</div>}
              {!isAdmin && <div className="text-xs text-amber-600 dark:text-amber-400">Only admin/hr can upload logo.</div>}
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <a href="/employees" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition">👥 Employees</a>
              <a href="/documents" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition">📄 Documents</a>
              <a href="/notifications" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition">🔔 Notifications</a>
              <a href="/settings" className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition">⚙️ Settings</a>
            </div>
          </Card>
        </>
      )}
      {msg && <div className="text-sm p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">{msg}</div>}
    </div>
  )
}
