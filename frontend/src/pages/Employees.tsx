import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../stores/auth'
import { UserPlus, Shield, Building2, Mail, ArrowUpRight, Search, X, CheckCircle2, Copy, AlertTriangle, FileSpreadsheet, Download, Edit2, Trash2, Upload } from 'lucide-react'
import CommunicationHub from '../components/CommunicationHub'

function resolveFileUrl(url?: string){
  if(!url) return ''
  if(url.startsWith('http://') || url.startsWith('https://')) return url
  if(url.startsWith('/uploads')){
    const base = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '')
    return `${base}${url}`
  }
  return url
}

type Employee = {
  id: string, employee_id: string, email: string, first_name: string, last_name: string,
  role: string, avatar_url?: string, department?: string, job_title?: string, phone?: string,
  date_of_joining?: string
}

export default function Employees(){
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search,setSearch]=useState('')
  const [todayMap,setTodayMap]=useState<Record<string,string>>({})
  const [showInvite,setShowInvite]=useState(false)
  const [invite,setInvite]=useState({firstName:'',lastName:'',email:'',jobTitle:'',department:'', role:'employee'})
  const [msg,setMsg]=useState('')
  const [result,setResult]=useState<{id:string, employee_id:string, temp_password:string, name:string}|null>(null)
  const [toast,setToast]=useState<{name:string, employee_id:string}|null>(null)
  const [highlightId,setHighlightId]=useState('')
  const [copied,setCopied]=useState('')
  const [creating,setCreating]=useState(false)

  // Bulk Import state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkData, setBulkData] = useState<any[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<any>(null)
  const [bulkErr, setBulkErr] = useState('')

  // Edit Employee state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editLoading, setEditLoading] = useState(false)

  // Delete Employee state
  const [deletingEmp, setDeletingEmp] = useState<Employee | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = async()=>{
    try{
      const {data} = await api.get('/users', {params: {search: search || undefined}})
      setEmployees(data)
    }catch{}
    if(isAdmin){
      try{
        const b = await api.get('/attendance/today/batch')
        const m:Record<string,string>={}
        b.data.forEach((x:any)=> m[x.user_id]=x.status)
        setTodayMap(m)
      }catch{}
    }
  }
  useEffect(()=>{ load() },[search])

  const doInvite = async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg(''); setResult(null)
    setCreating(true)
    try{
      const {data}=await api.post('/auth/invite', invite)
      setResult({id:data.id, employee_id:data.employee_id, temp_password:data.temp_password, name:`${invite.firstName} ${invite.lastName}`.trim()})
      setHighlightId(data.id)
      setTimeout(()=>setHighlightId(''), 8000)
      load()
    }catch(ex:any){ setMsg(ex.response?.data?.detail || 'Invite failed')}
    finally{ setCreating(false)}
  }

  const closeInvite = ()=>{
    setShowInvite(false)
    if(result){
      setToast({name:result.name, employee_id:result.employee_id})
      setTimeout(()=>setToast(null), 6000)
      setResult(null)
      setInvite({firstName:'',lastName:'',email:'',jobTitle:'',department:'', role:'employee'})
    }
  }

  const downloadTemplate = () => {
    const csv = "first_name,last_name,email,phone,role,department,job_title,date_of_joining,monthly_wage\nAarav,Sharma,aarav.sharma@example.com,+919876543210,employee,Engineering,Software Engineer,2026-01-15,65000\nPriya,Patel,priya.patel@example.com,+919876543211,hr,Human Resources,HR Executive,2026-02-01,55000\nRahul,Verma,rahul.verma@example.com,+919876543212,employee,Marketing,Marketing Lead,2026-03-10,60000\n"
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'staflo_employee_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const parseCsvFile = (file: File) => {
    setBulkErr('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
        if (lines.length <= 1) {
          setBulkErr('CSV file is empty or missing data rows.')
          return
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, '_'))
        const rows: any[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length < 2) continue
          const row: any = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ''
          })
          if (row.first_name && row.email) {
            rows.push(row)
          }
        }
        if (rows.length === 0) {
          setBulkErr('No valid employee rows parsed. Ensure first_name and email columns are present.')
        } else {
          setBulkData(rows)
        }
      } catch (err: any) {
        setBulkErr('Error parsing CSV file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const submitBulkImport = async () => {
    if (bulkData.length === 0) return
    setBulkLoading(true)
    setBulkErr('')
    try {
      const { data } = await api.post('/users/bulk-import', { employees: bulkData })
      setBulkResult(data)
      load()
    } catch (ex: any) {
      setBulkErr(ex.response?.data?.detail || 'Bulk import failed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const openEdit = (emp: Employee) => {
    setEditingEmp(emp)
    setEditForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      phone: emp.phone || '',
      department: emp.department || '',
      job_title: emp.job_title || '',
      role: emp.role,
      date_of_joining: emp.date_of_joining || ''
    })
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmp) return
    setEditLoading(true)
    try {
      await api.put(`/users/${editingEmp.id}`, editForm)
      setEditingEmp(null)
      load()
    } catch (ex: any) {
      alert(ex.response?.data?.detail || 'Failed to update employee')
    } finally {
      setEditLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!deletingEmp) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deletingEmp.id}`)
      setDeletingEmp(null)
      load()
    } catch (ex: any) {
      alert(ex.response?.data?.detail || 'Failed to delete employee')
    } finally {
      setDeleteLoading(false)
    }
  }

  const copyText = async(text:string, key:string)=>{
    try{
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(()=>setCopied(''), 1500)
    }catch{}
  }

  const hasAttendance = Object.keys(todayMap).length > 0

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees ({employees.length})</h1>
          {hasAttendance && <p className="text-sm text-zinc-500 mt-1">Manage staff, download template & bulk import</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400"/>
            <Input placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 w-56 bg-white dark:bg-zinc-900"/>
          </div>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => { setShowBulk(true); setBulkData([]); setBulkResult(null); setBulkErr('') }} className="gap-1.5 text-xs">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600"/> Bulk Import
              </Button>
              <Button onClick={()=>setShowInvite(true)} className="gap-2 text-xs bg-[#004E72] hover:bg-[#092634] text-white">
                <UserPlus className="h-4 w-4"/> Invite Employee
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp=>{
          const st=todayMap[emp.id]||'absent'
          const color=st==='present'?'bg-emerald-500':st==='half_day'?'bg-amber-500':st==='leave'?'bg-yellow-500':'bg-red-500'
          return (
            <Card key={emp.id} className={`p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition h-full relative group flex flex-col ${emp.id===highlightId ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`}>
              <div className="flex items-start justify-between">
                <Link to={`/profile/${emp.id}`} className="flex-1 min-w-0">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden text-zinc-600 dark:text-zinc-200">
                      {emp.avatar_url ? <img src={resolveFileUrl(emp.avatar_url)} className="h-full w-full object-cover"/> : `${emp.first_name[0]}${emp.last_name[0]}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-1">{emp.first_name} {emp.last_name} {emp.role!=='employee' && <Shield className="h-3 w-3 text-violet-500"/>}</div>
                      <div className="text-xs text-zinc-500 truncate flex items-center gap-1"><Mail className="h-3 w-3"/> {emp.employee_id} • <span className="capitalize">{emp.role}</span></div>
                      <div className="text-xs text-zinc-400 truncate flex items-center gap-1"><Building2 className="h-3 w-3"/> {emp.department || '—'} • {emp.job_title || ''}</div>
                      <div className="text-xs text-zinc-500 truncate">{emp.email}</div>
                    </div>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0 ml-2">
                    <button onClick={() => openEdit(emp)} title="Edit Employee" className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                      <Edit2 className="h-3.5 w-3.5"/>
                    </button>
                    {emp.id !== user?.id && (
                      <button onClick={() => setDeletingEmp(emp)} title="Delete Employee" className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                {hasAttendance ? (
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${st==='present'?'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': st==='half_day'?'bg-amber-50 text-amber-700':'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{st==='present'?'Present today': st==='half_day'?'Half-day': st==='leave'?'On leave':'Absent'}</span>
                ) : <span/>}
                <Link to={`/profile/${emp.id}`} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1 text-[11px] font-medium">
                  View Profile <ArrowUpRight className="h-3 w-3"/>
                </Link>
              </div>

              {/* Contact Hub */}
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">Contact:</span>
                <CommunicationHub user={emp} compact currentUserId={user?.id} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><Edit2 className="h-4 w-4 text-[#004E72]"/> Edit Employee ({editingEmp.employee_id})</h3>
              <button onClick={() => setEditingEmp(null)} className="h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400">✕</button>
            </div>
            <form onSubmit={submitEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">First Name</label>
                <Input value={editForm.first_name || ''} onChange={e => setEditForm({...editForm, first_name: e.target.value})} required className="h-9 text-sm"/>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Last Name</label>
                <Input value={editForm.last_name || ''} onChange={e => setEditForm({...editForm, last_name: e.target.value})} required className="h-9 text-sm"/>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Phone</label>
                <Input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="h-9 text-sm"/>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Department</label>
                <Input value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})} className="h-9 text-sm"/>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Job Title</label>
                <Input value={editForm.job_title || ''} onChange={e => setEditForm({...editForm, job_title: e.target.value})} className="h-9 text-sm"/>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Role</label>
                <select value={editForm.role || 'employee'} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs">
                  <option value="employee">Employee</option>
                  <option value="hr">HR Officer</option>
                  <option value="admin">Admin</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setEditingEmp(null)} className="h-9 text-xs">Cancel</Button>
                <Button type="submit" disabled={editLoading} className="h-9 text-xs bg-[#004E72] hover:bg-[#092634] text-white">
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deletingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="h-6 w-6"/>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Delete Employee</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to remove <span className="font-semibold text-zinc-800 dark:text-zinc-200">{deletingEmp.first_name} {deletingEmp.last_name}</span> ({deletingEmp.employee_id})?
              </p>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
              ⚠️ This will remove their attendance logs, leave records, and account access permanently.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeletingEmp(null)} className="flex-1 h-9 text-xs">Cancel</Button>
              <Button type="button" onClick={submitDelete} disabled={deleteLoading} className="flex-1 h-9 text-xs bg-red-600 hover:bg-red-700 text-white">
                {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <Card className="w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600"/> Bulk Import Employees (Excel / CSV)</h3>
              <button onClick={() => setShowBulk(false)} className="h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400">✕</button>
            </div>

            {bulkResult ? (
              <div className="space-y-4 text-center py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="h-7 w-7"/>
                </div>
                <h4 className="font-bold text-base">Bulk Import Finished</h4>
                <p className="text-xs text-zinc-500">
                  Imported <span className="font-bold text-emerald-600">{bulkResult.imported_count}</span> employees successfully. ({bulkResult.skipped_count} skipped).
                </p>
                <div className="max-h-48 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg text-left text-xs">
                  {bulkResult.imported?.map((u: any) => (
                    <div key={u.id} className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div><span className="font-semibold">{u.name}</span> ({u.email})</div>
                      <span className="font-mono text-zinc-500 text-[11px]">{u.employee_id}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setShowBulk(false)} className="w-full bg-[#004E72] text-white">Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  <div>
                    <div className="font-semibold">Step 1: Download Template</div>
                    <div className="text-zinc-500 text-[11px]">Get the formatted spreadsheet with required columns</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5"/> Download CSV Template
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">Step 2: Upload CSV / Excel File</label>
                  <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Upload className="h-8 w-8 text-zinc-400 mb-2"/>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Click or drag & drop file to import</span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">Supports .csv, .xlsx, .txt format</span>
                    <input type="file" accept=".csv,.txt" onChange={e => e.target.files?.[0] && parseCsvFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>

                {bulkErr && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">{bulkErr}</div>}

                {bulkData.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>Preview ({bulkData.length} records detected)</span>
                      <span className="text-emerald-600 font-normal">Ready to import</span>
                    </div>
                    <div className="max-h-48 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0 text-[11px]">
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Dept</th>
                            <th className="p-2">Wage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkData.slice(0, 10).map((r, i) => (
                            <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="p-2 font-medium">{r.first_name} {r.last_name}</td>
                              <td className="p-2 text-zinc-500">{r.email}</td>
                              <td className="p-2 capitalize">{r.role || 'employee'}</td>
                              <td className="p-2">{r.department || '—'}</td>
                              <td className="p-2 font-mono">₹{r.monthly_wage || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setShowBulk(false)} className="h-9 text-xs">Cancel</Button>
                  <Button type="button" onClick={submitBulkImport} disabled={bulkLoading || bulkData.length === 0} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    {bulkLoading ? 'Importing…' : `Import ${bulkData.length} Employees`}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInvite}/>
          <Card className="relative w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2"><UserPlus className="h-5 w-5"/> Invite Employee</h3>
              <button onClick={closeInvite} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-4 w-4"/></button>
            </div>
            {result ? (
              /* ===== Success state — stays open until user closes ===== */
              <div className="mt-4 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h4 className="mt-3 font-semibold text-lg">Employee created!</h4>
                <p className="text-sm text-zinc-500 mt-1"><span className="font-medium text-zinc-700 dark:text-zinc-300">{result.name}</span> has been added to your workspace. Share these credentials securely — <span className="font-medium text-amber-600 dark:text-amber-400">they won't be shown again</span>.</p>
                <div className="mt-4 space-y-2 text-left">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-zinc-400">Login ID (Employee ID)</div>
                      <div className="font-mono text-sm font-medium">{result.employee_id}</div>
                    </div>
                    <button type="button" onClick={()=>copyText(result.employee_id,'id')} className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 shrink-0"><Copy className="h-3 w-3"/>{copied==='id'?'Copied!':'Copy'}</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-zinc-400">Temporary password</div>
                      <div className="font-mono text-sm font-medium select-all">{result.temp_password}</div>
                    </div>
                    <button type="button" onClick={()=>copyText(result.temp_password,'pw')} className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 shrink-0"><Copy className="h-3 w-3"/>{copied==='pw'?'Copied!':'Copy'}</button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">The new employee must verify their email and set a permanent password on first login.</p>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={()=>{setResult(null); setMsg('')}}>Invite another</Button>
                  <Button className="flex-1" onClick={closeInvite}>Done</Button>
                </div>
              </div>
            ) : (
              /* ===== Form state ===== */
              <>
                <p className="text-xs text-zinc-500 mt-1">Auto Employee ID (OS0001…) + temp password • Email verification required • Cannot self-register</p>
                <form onSubmit={doInvite} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="First Name" value={invite.firstName} onChange={e=>setInvite({...invite, firstName:e.target.value})} required/>
                  <Input placeholder="Last Name" value={invite.lastName} onChange={e=>setInvite({...invite, lastName:e.target.value})} required/>
                  <Input placeholder="Email" type="email" value={invite.email} onChange={e=>setInvite({...invite, email:e.target.value})} required className="md:col-span-2"/>
                  <Input placeholder="Job Title" value={invite.jobTitle} onChange={e=>setInvite({...invite, jobTitle:e.target.value})} />
                  <Input placeholder="Department" value={invite.department} onChange={e=>setInvite({...invite, department:e.target.value})} />
                  <select value={invite.role} onChange={e=>setInvite({...invite, role:e.target.value})} className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm md:col-span-2">
                    <option value="employee">Employee</option>
                    <option value="hr">HR Officer</option>
                    <option value="admin">Admin</option>
                    <option value="intern">Intern</option>
                  </select>
                  <Button type="submit" disabled={creating} className="md:col-span-2">{creating ? 'Inviting…' : 'Invite & Generate ID'}</Button>
                </form>
                {msg && <div className="mt-3 text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>{msg}</div>}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Created-successfully toast */}
      {toast && (
        <div className="fixed top-16 right-4 z-[60] max-w-sm w-full sm:w-auto">
          <Card className="overflow-hidden shadow-xl border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 p-0">
            <div className="flex items-start gap-3 p-4">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">Employee created 🎉</div>
                <div className="text-xs text-zinc-500 mt-0.5">{toast.name || 'New teammate'} joined as <span className="font-mono">{toast.employee_id}</span>. Credentials were shown once — share them securely.</div>
              </div>
              <button onClick={()=>setToast(null)} className="shrink-0 h-6 w-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"><X className="h-3.5 w-3.5"/></button>
            </div>
            <div className="h-1 bg-emerald-500"/>
          </Card>
        </div>
      )}
    </div>
  )
}
