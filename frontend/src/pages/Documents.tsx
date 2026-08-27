import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { Link } from 'react-router-dom'
import { FileText, Upload, Trash2, Search, Download, File, User } from 'lucide-react'

function resolveFileUrl(url?: string){
  if(!url) return '#'
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8001/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

export default function Documents(){
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '')
  const [docs, setDocs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadEmployees = async()=>{
    try{ const {data}=await api.get('/users'); setEmployees(data); if(!selectedUser && data[0]) setSelectedUser(data[0].id) }catch{}
  }
  const loadDocs = async()=>{
    if(!selectedUser) return
    try{ const {data}=await api.get(`/documents/${selectedUser}`); setDocs(data) }catch{ setDocs([]) }
  }

  useEffect(()=>{ loadEmployees() },[])
  useEffect(()=>{ loadDocs() },[selectedUser])

  const handleUpload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0]
    if(!file || !selectedUser) return
    setUploading(true); setMsg('')
    const fd = new FormData()
    fd.append('file', file)
    try{
      await api.post(`/documents/upload/${selectedUser}`, fd, {headers:{'Content-Type':'multipart/form-data'}})
      setMsg(`Uploaded ${file.name}`)
      await loadDocs()
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Upload failed')}
    finally{ setUploading(false); e.target.value='' }
  }

  const handleDelete = async(docId:string)=>{
    if(!confirm('Delete this document?')) return
    try{ await api.delete(`/documents/${docId}`); setMsg('Deleted'); await loadDocs() }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Delete failed')}
  }

  const filtered = docs.filter(d=> !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.mime_type?.toLowerCase().includes(search.toLowerCase()))

  const selectedUserObj = employees.find(e=>e.id===selectedUser) || user

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6 text-violet-600"/> Documents</h1>
          <p className="text-sm text-zinc-500 mt-1">Centralized employee documents • Resumes, IDs, certificates • Storage: Supabase `employee-documents` + local fallback</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
            <Input placeholder="Search documents..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 w-56 bg-white dark:bg-zinc-900"/>
          </div>
        </div>
      </div>

      {/* User picker */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium flex items-center gap-1.5"><User className="h-4 w-4"/> View docs for:</span>
          <select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)} className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm min-w-[220px]">
            {employees.map((emp:any)=>(
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} • {emp.employee_id} {emp.id===user?.id ? '(You)' : ''}</option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">• {isAdmin ? 'Admin: can view/manage all' : 'Employee: only your own'}</span>
          {selectedUserObj && <Link to={`/profile/${selectedUser}`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">View Profile →</Link>}
        </div>
      </Card>

      {/* Upload */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4"/> Upload Document</h3>
        <p className="text-xs text-zinc-500 mt-1">Any file type • Visible only to you and admins</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-[#004E72] text-white text-sm font-medium cursor-pointer hover:bg-[#FF6E42] transition">
            <Upload className="h-4 w-4"/> {uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" onChange={handleUpload} className="hidden" disabled={uploading}/>
          </label>
          <span className="text-xs text-zinc-500">Upload to <b>{selectedUserObj?.first_name} {selectedUserObj?.last_name}</b> ({selectedUserObj?.employee_id})</span>
        </div>
        {msg && <div className="mt-3 text-sm p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">{msg}</div>}
      </Card>

      {/* Docs list */}
      <div>
        <h3 className="font-semibold flex items-center gap-2"><File className="h-4 w-4"/> {filtered.length} Document{filtered.length!==1?'s':''} {search && `for "${search}"`}</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length===0 ? (
            <Card className="p-8 col-span-full text-center">
              <FileText className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700"/>
              <div className="mt-2 font-medium">No documents</div>
              <div className="text-sm text-zinc-500">{search ? 'No match for search' : 'Upload your first document above'}</div>
            </Card>
          ) : filtered.map((d:any)=>(
            <Card key={d.id} className="p-4 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition group">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
                  <FileText className="h-5 w-5"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm" title={d.name}>{d.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{d.mime_type || '—'} • {new Date(d.uploaded_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={resolveFileUrl(d.file_url)} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-medium transition">
                  <Download className="h-3.5 w-3.5"/> View / Download
                </a>
                <Button variant="outline" size="sm" onClick={()=>handleDelete(d.id)} className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-3.5 w-3.5"/>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
