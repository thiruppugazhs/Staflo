import React from 'react';
import { Modal } from '../Common/Modal';
import { ShieldCheck } from 'lucide-react';

export function SalarySlipModal({ isOpen, onClose, slip }) {
  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monthly Salary Pay Slip" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Printable Area */}
        <div
          id="printable-salary-slip"
          className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs text-stone-800"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-stone-900 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-xl">
                D
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">Daily Flow HRMS</h2>
                <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">by ORCESCALE</p>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs uppercase font-semibold text-stone-400 tracking-wider">Official Pay Statement</div>
              <div className="text-lg font-bold text-amber-700">
                {slip.month} {slip.year}
              </div>
              <div className="text-xs text-stone-500">
                Payment Date: {slip.payment_date || 'End of Month'}
              </div>
            </div>
          </div>

          {/* Employee & Job Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-stone-100 text-xs">
            <div>
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Employee Name</span>
              <span className="font-bold text-stone-900 text-sm">{slip.employee_name}</span>
            </div>
            <div>
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Employee ID</span>
              <span className="font-bold text-stone-900 font-mono text-sm">{slip.employee_id}</span>
            </div>
            <div>
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Department</span>
              <span className="font-bold text-stone-900">{slip.department}</span>
            </div>
            <div>
              <span className="text-stone-400 font-semibold block uppercase text-[10px]">Designation</span>
              <span className="font-bold text-stone-900">{slip.designation}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            {/* Earnings */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-50 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 flex justify-between">
                <span>Earnings Breakdown</span>
                <span>Amount (₹)</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Basic Salary</span>
                  <span className="font-mono font-semibold text-stone-900">₹{slip.basic_salary?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-semibold text-stone-900">₹{slip.hra?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Special Allowances</span>
                  <span className="font-mono font-semibold text-stone-900">₹{slip.allowances?.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-emerald-700">
                    ₹{((slip.basic_salary || 0) + (slip.hra || 0) + (slip.allowances || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="bg-stone-50 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-stone-700 border-b border-stone-200 flex justify-between">
                <span>Deductions & Taxes</span>
                <span>Amount (₹)</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Income Tax (TDS)</span>
                  <span className="font-mono font-semibold text-stone-900">
                    ₹{(Math.round((slip.deductions || 0) * 0.6)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Provident Fund (EPF)</span>
                  <span className="font-mono font-semibold text-stone-900">
                    ₹{(Math.round((slip.deductions || 0) * 0.4)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Professional Tax</span>
                  <span className="font-mono font-semibold text-stone-900">₹0</span>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-700">-₹{(slip.deductions || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Banner */}
          <div className="bg-stone-900 text-white p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs uppercase font-bold text-stone-300 tracking-wider">Net Monthly Take-Home Pay</div>
              <div className="text-xs text-stone-400">Credited via direct bank transfer</div>
            </div>
            <div className="text-3xl font-black font-mono text-amber-400">
              ₹{slip.net_pay?.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Computer generated pay stub. Authorized by Daily Flow HR & Payroll.</span>
            </div>
            <div>Status: <b className="text-emerald-700 uppercase">{slip.status}</b></div>
          </div>
        </div>

        {/* Action buttons (hidden on print) */}
        <div className="flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition cursor-pointer"
          >
            Print Pay Slip
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SalarySlipModal;
