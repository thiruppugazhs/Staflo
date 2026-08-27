import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

export default function Settings(){
  const { user } = useAuth()
  const isAdmin = user?.role==='admin' || user?.role==='hr'
  const [company,setCompany]=useState<any>(null)
  const [name,setName]=useState('')
  const [msg,setMsg]=useState('')
  const [logoFile,setLogoFile]=useState<File|null>(null)
  const [logoPreview,setLogoPreview]=useState<string|null>(null)
  const [uploading,setUploading]=useState(false)
  const [pwd,setPwd]=useState({old:'', next:'', confirm:''})

  const load = async()=>{
    try{ const {data}=await api.get('/companies/me'); setCompany(data); setName(data.name)}catch(e:any){ setMsg(e.response?.data?.detail||'load failed')}
  }
  useEffect(()=>{ load() },[])

  const saveName = async()=>{
    setMsg('')
    try{ const {data}=await api.patch('/companies/me', {name}); setCompany(data); setMsg('Company name updated')} catch(e:any){ setMsg(e.response?.data?.detail||'failed')}
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
      // do NOT set Content-Type manually — let axios add boundary
      const {data}=await api.post('/companies/logo', fd)
      setCompany((c:any)=> ({...c, logo_url:data.logo_url}))
      setMsg('Logo uploaded ✓')
      setLogoFile(null); setLogoPreview(null)
      // reset file input visually
      const el = document.getElementById('logo-input') as HTMLInputElement | null
      if(el) el.value=''
    } catch(e:any){
      const detail = e.response?.data?.detail
      if(Array.isArray(detail)) setMsg(detail.map((d:any)=> d.msg || JSON.stringify(d)).join(', '))
      else if(typeof detail==='string') setMsg(detail)
      else setMsg(e.response?.data?.message || e.message || 'upload failed')
    } finally{ setUploading(false) }
  }
  const changePwd = async()=>{
    if(pwd.next!==pwd.confirm) return setMsg('Next passwords mismatch')
    try{ await api.post('/auth/change-password', {old_password: pwd.old, new_password: pwd.next}); setMsg('Password changed — re-login'); setPwd({old:'',next:'',confirm:''})}catch(e:any){ setMsg(e.response?.data?.detail||'failed')}
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Company Settings</h1>
      <p className="text-sm text-zinc-500">Admin/HR only can edit company.Logo  `company-logos` (fallback `uploads/company-logos`).</p>
      {company ? (
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-sm">Company Name (slug: {company.slug})</label>
            <div className="flex gap-2 mt-1">
              <Input value={name} onChange={e=>setName(e.target.value)} disabled={!isAdmin}/>
              <Button onClick={saveName} disabled={!isAdmin}>Save</Button>
            </div>
          </div>
          <div>
            <label className="text-sm">Company Logo</label>
            {company.logo_url && <img src={resolveFileUrl(company.logo_url)} alt="logo" className="h-16 mt-2 border border-zinc-200 dark:border-zinc-800 rounded object-contain bg-white"/>}
            {logoPreview && <img src={logoPreview} alt="preview" className="h-16 mt-2 border border-violet-300 rounded object-contain bg-white"/>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input id="logo-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>handleFileChange(e.target.files?.[0]||null)} className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:text-white file:text-xs hover:file:bg-zinc-800 dark:file:bg-zinc-700" disabled={!isAdmin}/>
              <Button size="sm" variant="outline" onClick={uploadLogo} disabled={!isAdmin || !logoFile || uploading}>{uploading ? 'Uploading…' : 'Upload Logo'}</Button>
              {logoFile && <span className="text-xs text-zinc-600 truncate max-w-[180px]">{logoFile.name} • {(logoFile.size/1024).toFixed(0)}KB</span>}
            </div>
            {logoFile && <div className="text-xs text-zinc-500">Ready to upload — click Upload Logo. Max 2MB, image/*.</div>}
          </div>
          <div className="text-xs text-zinc-500">Wireframe Sign Up `Upload Logo` → this stored as `logo_url` on Company.</div>
        </Card>
      ): <div className="text-sm text-zinc-500">Loading company...</div>}

      <Card className="p-6 space-y-3">
        <h3 className="font-semibold">Change Password (forced if temp)</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Input type="password" placeholder="Current" value={pwd.old} onChange={e=>setPwd({...pwd, old:e.target.value})}/>
          <Input type="password" placeholder="New 8+ U/l, num, special" value={pwd.next} onChange={e=>setPwd({...pwd, next:e.target.value})}/>
          <Input type="password" placeholder="Confirm new" value={pwd.confirm} onChange={e=>setPwd({...pwd, confirm:e.target.value})}/>
        </div>
        <Button size="sm" onClick={changePwd}>Change Password</Button>
      </Card>
      {msg && <div className="text-sm p-3 rounded bg-zinc-900 border border-zinc-200 dark:border-zinc-800">{msg}</div>}
      {!isAdmin && <div className="text-sm text-amber-400">You are {user?.role} — only admin/hr can edit company settings.</div>}
    </div>
  )
}
