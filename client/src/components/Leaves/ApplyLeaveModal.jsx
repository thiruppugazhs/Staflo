import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, AlertCircle } from 'lucide-react';

export function ApplyLeaveModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotification();
  const [formData, setFormData] = useState({
    leave_type: 'PAID',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    total_days: 1,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime < 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleDateChange = (field, val) => {
    const nextForm = { ...formData, [field]: val };
    const days = calculateDays(
      field === 'start_date' ? val : nextForm.start_date,
      field === 'end_date' ? val : nextForm.end_date
    );
    nextForm.total_days = days;
    setFormData(nextForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast('Please provide a reason for the leave request', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.applyLeave(formData);
      if (res.success) {
        showToast('Leave request submitted to HR for approval!', 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Time-Off / Leave" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Leave Type
          </label>
          <select
            value={formData.leave_type}
            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium text-slate-800"
          >
            <option value="PAID">Paid Leave (Annual Vacation)</option>
            <option value="SICK">Sick Leave (Medical / Health)</option>
            <option value="CASUAL">Casual Leave (Short Personal Time-off)</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              min={formData.start_date}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              required
            />
          </div>
        </div>

        <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl flex items-center justify-between text-xs">
          <span className="font-semibold text-primary-900">Total Duration:</span>
          <span className="font-extrabold text-primary-700 bg-white px-2.5 py-1 rounded-lg border border-primary-200">
            {formData.total_days} {formData.total_days === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Reason / Remarks
          </label>
          <textarea
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Explain reason for leave request (e.g. Vacation with family, Doctor appointment)..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/30 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
