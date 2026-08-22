import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export function EditSalaryModal({ isOpen, onClose, employee, onSuccess }) {
  const { showToast } = useNotification();
  const [form, setForm] = useState({
    basic_salary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        basic_salary: employee.basic_salary || 0,
        hra: employee.hra || 0,
        allowances: employee.allowances || 0,
        deductions: employee.deductions || 0,
      });
    }
  }, [employee]);

  if (!employee) return null;

  const basic = parseFloat(form.basic_salary) || 0;
  const hra = parseFloat(form.hra) || 0;
  const allowances = parseFloat(form.allowances) || 0;
  const deductions = parseFloat(form.deductions) || 0;
  const calculatedNet = basic + hra + allowances - deductions;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateSalaryStructure(employee.user_id || employee.id, form);
      if (res.success) {
        showToast(`Updated salary structure for ${employee.name}`, 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure Salary: ${employee.name}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-center justify-between">
          <div>
            <div className="font-semibold text-stone-900">{employee.name}</div>
            <div className="text-stone-500">{employee.designation} • {employee.department}</div>
          </div>
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded">
            {employee.employee_id}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Basic Monthly Salary (₹)
          </label>
          <input
            type="number"
            value={form.basic_salary}
            onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
            min="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              HRA (₹)
            </label>
            <input
              type="number"
              value={form.hra}
              onChange={(e) => setForm({ ...form, hra: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Allowances (₹)
            </label>
            <input
              type="number"
              value={form.allowances}
              onChange={(e) => setForm({ ...form, allowances: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Monthly Deductions (₹)
          </label>
          <input
            type="number"
            value={form.deductions}
            onChange={(e) => setForm({ ...form, deductions: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-rose-700"
            required
            min="0"
          />
        </div>

        <div className="p-3.5 bg-stone-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Calculated Net Monthly</div>
            <div className="text-lg font-bold font-mono text-amber-400">
              ₹{calculatedNet.toLocaleString('en-IN')}
            </div>
          </div>
          <span className="text-[10px] text-stone-400">Basic + HRA + Allow - Deductions</span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition"
          >
            {loading ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditSalaryModal;
