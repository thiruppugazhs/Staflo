import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  WalletCards,
  FileText,
  Edit2,
  Search,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { SalarySlipModal } from '../../components/Payroll/SalarySlipModal';
import { EditSalaryModal } from '../../components/Payroll/EditSalaryModal';
import { Modal } from '../../components/Common/Modal';

export function PayrollPage() {
  const { user, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [slips, setSlips] = useState([]);
  const [adminRecords, setAdminRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('August');
  const [generateYear, setGenerateYear] = useState(2026);
  const [generating, setGenerating] = useState(false);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      if (isPrivileged) {
        const res = await api.getPayroll({ search });
        if (res.success) {
          setAdminRecords(res.records);
          setSummary(res.summary);
        }
        const mySlipsRes = await api.getSalarySlips();
        if (mySlipsRes.success) setSlips(mySlipsRes.slips);
      } else {
        const res = await api.getPayroll();
        if (res.success) {
          setSalaryStructure(res.salary);
          setSlips(res.slips || []);
        }
      }
    } catch (err) {
      console.error('Payroll load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, [search]);

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.generateMonthlyPayroll({
        month: generateMonth,
        year: parseInt(generateYear, 10),
      });
      if (res.success) {
        showToast(res.message, 'success');
        setIsGenerateOpen(false);
        loadPayrollData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <WalletCards className="w-6 h-6 text-amber-600" />
            <span>Payroll & Compensation Management</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isPrivileged
              ? 'Configure compensation structures, verify tax deductions, and process monthly disbursements in Rupees (₹).'
              : 'Review your verified monthly salary pay slips and compensation details.'}
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Generate Monthly Payroll</span>
          </button>
        )}
      </div>

      {/* Admin / HR Overview Cards */}
      {isPrivileged && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Monthly Payroll</span>
            <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              ₹{summary.totalMonthlyPayroll.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-stone-500 mt-1">{summary.totalEmployees} active personnel</div>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Average Take-Home</span>
            <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">
              ₹{summary.avgSalary.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-stone-500 mt-1">Net compensation per person</div>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Disbursement Status</span>
            <div className="text-xl font-bold text-stone-900 mt-1 flex items-center gap-2">
              <span>Ready for Processing</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-stone-500 mt-1">Direct bank transfer</div>
          </Card>
        </div>
      )}

      {/* Workforce Salary Structures Table */}
      {isPrivileged ? (
        <Card className="p-0 overflow-hidden" title="Workforce Salary Configurations (₹)">
          <div className="p-3.5 bg-stone-50 border-b border-stone-200">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 uppercase text-xs font-semibold text-stone-400 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Basic (₹)</th>
                  <th className="py-3 px-4">HRA (₹)</th>
                  <th className="py-3 px-4">Allowances (₹)</th>
                  <th className="py-3 px-4">Deductions (₹)</th>
                  <th className="py-3 px-4">Net Take-Home (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-xs">
                {adminRecords.map((r) => (
                  <tr key={r.user_id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-950 font-bold flex items-center justify-center text-xs">
                          {r.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{r.name}</div>
                          <div className="text-[10px] text-stone-400">{r.department} • {r.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700">₹{r.basic_salary?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono text-stone-700">₹{r.hra?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono text-stone-700">₹{r.allowances?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono text-rose-700">-₹{r.deductions?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900 text-sm">
                      ₹{r.net_salary?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingEmployee(r)}
                        className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:text-amber-900 text-stone-700 text-xs font-semibold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Configure</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Employee View: Compensation Breakdown & Slips */
        <div className="space-y-6">
          {salaryStructure && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4 bg-white">
                <span className="text-[10px] uppercase font-semibold text-stone-400">Basic Monthly Pay</span>
                <div className="text-xl font-bold font-mono text-stone-900 mt-1">
                  ₹{salaryStructure.basic_salary?.toLocaleString('en-IN')}
                </div>
              </Card>
              <Card className="p-4 bg-white">
                <span className="text-[10px] uppercase font-semibold text-stone-400">HRA + Allowances</span>
                <div className="text-xl font-bold font-mono text-stone-900 mt-1">
                  ₹{((salaryStructure.hra || 0) + (salaryStructure.allowances || 0)).toLocaleString('en-IN')}
                </div>
              </Card>
              <Card className="p-4 bg-white">
                <span className="text-[10px] uppercase font-semibold text-stone-400">Tax & PF Deductions</span>
                <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                  -₹{salaryStructure.deductions?.toLocaleString('en-IN')}
                </div>
              </Card>
              <Card className="p-4 bg-stone-900 text-white">
                <span className="text-[10px] uppercase font-semibold text-stone-400">Net Monthly Salary</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  ₹{salaryStructure.net_salary?.toLocaleString('en-IN')}
                </div>
              </Card>
            </div>
          )}

          {/* Salary Slips Table */}
          <Card title="Monthly Salary Pay Slips Archive" className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 uppercase text-xs font-semibold text-stone-400 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Pay Period</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Gross Earnings</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Take-Home</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs">
                  {slips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No pay slips generated yet.
                      </td>
                    </tr>
                  ) : (
                    slips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {slip.month} {slip.year}
                        </td>
                        <td className="py-3 px-4 text-stone-600">{slip.payment_date || 'End of Month'}</td>
                        <td className="py-3 px-4 font-mono text-stone-800">
                          ₹{((slip.basic_salary || 0) + (slip.hra || 0) + (slip.allowances || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-700">
                          -₹{(slip.deductions || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-900 text-sm">
                          ₹{slip.net_pay?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={slip.status} size="sm">{slip.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedSlip({
                              ...slip,
                              employee_name: user?.name,
                              employee_id: user?.employee_id,
                              department: user?.department,
                              designation: user?.designation,
                            })}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View & Print</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Salary Slip Modal */}
      {selectedSlip && (
        <SalarySlipModal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          slip={selectedSlip}
        />
      )}

      {/* Edit Salary Modal */}
      {editingEmployee && (
        <EditSalaryModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSuccess={loadPayrollData}
        />
      )}

      {/* Batch Generate Payroll Modal */}
      {isGenerateOpen && (
        <Modal
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          title="Process Monthly Payroll Batch"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleGeneratePayroll} className="space-y-3.5 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
              This action will calculate net disbursements and generate monthly pay slips in Rupees (₹) for all active team members.
            </div>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Month
              </label>
              <select
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Year
              </label>
              <input
                type="number"
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl shadow-xs"
              >
                {generating ? 'Processing...' : 'Run Payroll'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PayrollPage;
