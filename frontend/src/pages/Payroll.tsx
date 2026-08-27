import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/toast'
import { useAuth } from '../stores/auth'

export default function Payroll(){
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'admin' || user?.role === 'hr'
  const [pay, setPay] = useState<any>(null)
  const [allPay, setAllPay] = useState<any[]>([])
  const [components, setComponents] = useState<any[]>([])

  const load = async()=>{
    try{ const p = await api.get('/reports/payroll'); setPay(p.data)}catch{}
    if(isAdmin){
      try{ const ap = await api.get('/payroll/all'); setAllPay(ap.data)}catch{}
      try{ const c = await api.get('/payroll/components'); setComponents(c.data)}catch{}
    }
  }
  useEffect(()=>{ load() },[])

  const seed = async()=>{
    try{
      await api.post('/payroll/seed-defaults')
      const c = await api.get('/payroll/components')
      setComponents(c.data)
      toast.success('Default salary components seeded ✓')
    }catch(e:any){ toast.error(e.response?.data?.detail || 'Failed to seed components') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-sm text-zinc-500">Monthly wage • breakdown • PF 12% of Basic • PT ₹200 • attendance-based payroll (spec 3.6). {isAdmin ? 'Admin/HR can manage all.' : 'Employees see own slip via Reports → My Salary Slip.'}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-sm">Payroll Overview</h3>
          {pay ? (
            <div className="mt-2 text-sm space-y-1">
              <div>Employees: <b>{pay.employees}</b> • Structures: <b>{pay.salary_structures}</b></div>
              <div>Total monthly: <b>₹{pay.total_monthly_payroll?.toLocaleString()}</b></div>
              <div>Avg salary: <b>₹{pay.avg_salary}</b></div>
            </div>
          ): <div className="text-sm text-zinc-500 mt-2">No payroll data yet — set salary via Profile → Salary Info.</div>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-sm">Salary Components Template</h3>
          {components.length>0 ? (
            <div className="mt-2 text-xs space-y-1">
              {components.map((c:any)=>(<div key={c.id} className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 py-1"><span>{c.name} <span className="text-zinc-500">({c.type})</span></span><span>{c.value_type==='percentage'? c.value+'%'+(c.percentage_of? ' of '+c.percentage_of:'') : '₹'+c.value}</span></div>))}
            </div>
          ): <div className="text-xs text-zinc-500 mt-2">No components. Admin can seed defaults (Basic 40% wage, HRA 20%, PF 12% basic, PT 200).</div>}
          {isAdmin && <Button size="sm" variant="outline" className="mt-3" onClick={seed}>Seed Defaults</Button>}
        </Card>
      </div>

      {isAdmin ? (
        <Card className="p-4 overflow-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">All Employees Payroll (Admin/HR)</h3>
            <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
          </div>
          {allPay.length>0 ? (
            <table className="w-full text-sm mt-3">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400"><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">ID</th><th className="p-2 text-right">Monthly</th><th className="p-2 text-right">Yearly</th><th className="p-2 text-left">Action</th></tr></thead>
              <tbody>
                {allPay.map((row:any)=>(
                  <tr key={row.user_id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2 font-mono text-xs">{row.employee_id}</td>
                    <td className="p-2 text-right">₹{row.monthly_wage}</td>
                    <td className="p-2 text-right">₹{row.yearly_wage}</td>
                    <td className="p-2"><Link to={`/profile/${row.user_id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View / Edit Salary</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ): <div className="text-sm text-zinc-500 mt-4">No salary structures yet. Open any employee profile → Salary Info to set monthly wage.</div>}
        </Card>
      ) : (
        <Card className="p-6 text-sm text-zinc-500">
          Your salary details are in <Link to="/reports" className="text-indigo-600 dark:text-indigo-400 underline">Reports → My Salary Slip</Link> and <Link to="/me" className="text-indigo-600 dark:text-indigo-400 underline">My Profile → Salary Info</Link> (read-only).
        </Card>
      )}
    </div>
  )
}
