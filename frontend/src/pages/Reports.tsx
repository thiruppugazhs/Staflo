import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../stores/auth'

export default function Reports(){
  const { user } = useAuth()
  const isAdmin = user?.role==='admin' || user?.role==='hr'
  const [att,setAtt]=useState<any>(null)
  const [leave,setLeave]=useState<any>(null)
  const [pay,setPay]=useState<any>(null)
  const [slip,setSlip]=useState<any>(null)
  const [allPay,setAllPay]=useState<any[]>([])

  const load = async()=>{
    try{ const a=await api.get('/reports/attendance'); setAtt(a.data)}catch{}
    if(isAdmin){
      try{ const l=await api.get('/reports/leave'); setLeave(l.data)}catch{}
      try{ const p=await api.get('/reports/payroll'); setPay(p.data)}catch{}
      try{ const ap=await api.get('/payroll/all'); setAllPay(ap.data)}catch{}
    }
    try{
      const s=await api.get(`/reports/salary-slip/${user?.id}`)
      setSlip(s.data)
    }catch{}
  }
  useEffect(()=>{load()},[])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics & Reports</h1>
      <p className="text-sm text-zinc-500">Reports like salary slips or attendance — as per spec 3.6 + Future Enhancements.</p>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Attendance Summary</h3>
          {att ? (
            <div className="mt-2 text-sm space-y-1">
              <div>Total records: <b>{att.total_records}</b></div>
              <div>Present: <span className="text-green-400">{att.present}</span> • Half: {att.half_day} • Absent: <span className="text-red-400">{att.absent}</span> • Leave: {att.leave}</div>
              <div>Avg hours: {att.avg_hours}h</div>
            </div>
          ): <div className="text-zinc-500 text-sm">No data</div>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Leave Analytics {isAdmin ? '' : '(Admin only)'}</h3>
          {leave ? (
            <div className="mt-2 text-sm space-y-1">
              <div>Total: {leave.total} • Pending: <span className="text-amber-400">{leave.pending}</span> • Approved: {leave.approved} • Rejected: {leave.rejected}</div>
              <div>Paid: {leave.by_type.paid} • Sick: {leave.by_type.sick} • Unpaid: {leave.by_type.unpaid}</div>
            </div>
          ): <div className="text-sm text-zinc-500">{isAdmin ? 'No leaves' : 'Requires admin/hr'}</div>}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold">Payroll Overview {isAdmin ? '' : '(Admin only)'}</h3>
          {pay ? (
            <div className="mt-2 text-sm space-y-1">
              <div>Employees: {pay.employees} • Structures: {pay.salary_structures}</div>
              <div>Total monthly: ₹{pay.total_monthly_payroll}</div>
              <div>Avg salary: ₹{pay.avg_salary}</div>
            </div>
          ): <div className="text-sm text-zinc-500">{isAdmin ? 'No payroll' : 'Requires admin/hr'}</div>}
        </Card>
      </div>

      {isAdmin && allPay.length>0 && (
        <Card className="p-4 overflow-auto">
          <h3 className="font-semibold">All Employees Payroll (Admin/HR — spec 3.6.2)</h3>
          <table className="w-full text-sm mt-3">
            <thead className="bg-zinc-900 text-xs text-zinc-400"><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-left">ID</th><th className="p-2 text-right">Monthly</th><th className="p-2 text-right">Yearly</th><th className="p-2 text-right">Effective From</th></tr></thead>
            <tbody>
              {allPay.map((row:any)=>(
                <tr key={row.user_id} className="border-t border-zinc-200 dark:border-zinc-800"><td className="p-2">{row.name}</td><td className="p-2 font-mono text-xs">{row.employee_id}</td><td className="p-2 text-right">₹{row.monthly_wage}</td><td className="p-2 text-right">₹{row.yearly_wage}</td><td className="p-2 text-right text-xs">{row.effective_from || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="p-4" id="payslip-print">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">My Salary Slip — {slip?.period || '—'}</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
            <Button size="sm" onClick={()=>window.print()}>Print / Save PDF</Button>
          </div>
        </div>
        {slip && !slip.error ? (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Monthly Wage: <b>₹{slip.monthly_wage}</b></div>
              <div>Payable Days: {slip.payable_days}/30 • Adjusted Net: <b>₹{slip.net_pay_adjusted}</b></div>
            </div>
            {slip.breakdown && (
              <table className="w-full text-sm mt-3 border border-zinc-200 dark:border-zinc-800 rounded">
                <thead className="bg-zinc-900 text-xs text-zinc-400"><tr><th className="p-2 text-left">Component</th><th className="p-2 text-right">Monthly</th><th className="p-2 text-right">Yearly</th></tr></thead>
                <tbody>
                  {slip.breakdown.breakdown?.map((b:any,i:number)=>(
                    <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800"><td className="p-2">{b.name}</td><td className="p-2 text-right">₹{b.amount_monthly}</td><td className="p-2 text-right">₹{b.amount_yearly}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="text-xs text-zinc-500 mt-2">Slip generated based on attendance — unpaid absences auto-reduce as per spec: attendance as basis for payroll. Use Print to save as PDF (spec 3.6).</div>
          </div>
        ): <div className="text-sm text-zinc-500 mt-2">{slip?.error || 'No salary structure yet — admin must set via Profile → Salary Info'}</div>}
      </Card>
    </div>
  )
}
