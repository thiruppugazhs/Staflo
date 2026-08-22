import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Info, Lock } from 'lucide-react';

export function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const { user, isAdmin, isHr } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const defaultDept = isHr && user?.department ? user.department : 'Engineering';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Employee@1234',
    role: 'EMPLOYEE',
    department: defaultDept,
    designation: 'Software Engineer',
    phone: '',
    address: '',
    basic_salary: 5500,
    hra: 1800,
    allowances: 1000,
    deductions: 800,
  });

  useEffect(() => {
    if (isHr && user?.department) {
      setForm((prev) => ({ ...prev, department: user.department }));
    }
  }, [isHr, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        department: isHr && user?.department ? user.department : form.department,
      };

      const res = await api.createEmployee(payload);
      if (res.success) {
        showToast(res.message, 'success');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAdmin ? "Onboard Team Member (HR or Employee)" : `Onboard Employee (${user?.department || 'Department'})`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Department Scoping Banner for HR */}
        {isHr && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <b>Department Scoped HR:</b> As HR Officer for <b>{user?.department}</b>, newly onboarded staff are assigned directly to <b>{user?.department}</b>.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Jordan Miller"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Work Email
            </label>
            <input
              type="email"
              placeholder="jordan@dayflow.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Department
            </label>
            {isAdmin ? (
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            ) : (
              <div className="px-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-800 font-bold flex items-center justify-between">
                <span>{user?.department || 'Assigned Department'}</span>
                <Lock className="w-3.5 h-3.5 text-stone-400" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Account Role
            </label>
            {isAdmin ? (
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
              >
                <option value="EMPLOYEE">Standard Employee</option>
                <option value="HR">HR Officer</option>
              </select>
            ) : (
              <div className="px-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-700 font-semibold">
                Standard Employee
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Designation / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Backend Engineer"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Mobile Number <span className="text-[10px] text-amber-700 font-semibold lowercase">(initial temp password)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100">
          <div className="text-xs font-semibold text-stone-900 mb-2 uppercase tracking-wider">
            Monthly Compensation Structure (₹)
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block">Basic (₹)</label>
              <input
                type="number"
                value={form.basic_salary}
                onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block">HRA (₹)</label>
              <input
                type="number"
                value={form.hra}
                onChange={(e) => setForm({ ...form, hra: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block">Allowances (₹)</label>
              <input
                type="number"
                value={form.allowances}
                onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 block">Deductions (₹)</label>
              <input
                type="number"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-rose-700"
              />
            </div>
          </div>
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
            className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-stone-950" />
            <span>{loading ? 'Processing...' : isAdmin && form.role === 'HR' ? 'Create HR Officer' : 'Onboard Employee'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddEmployeeModal;
