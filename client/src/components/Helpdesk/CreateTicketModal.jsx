import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { LifeBuoy, Send } from 'lucide-react';

export function CreateTicketModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'PAYROLL',
    priority: 'MEDIUM',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createHelpdeskTicket(form);
      if (res.success) {
        showToast('Support query submitted to HR', 'success');
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
      title="Raise Support Query / Helpdesk Request"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Query Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Discrepancy in August salary slip deductions"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
            >
              <option value="PAYROLL">Payroll & Compensation</option>
              <option value="LEAVE">Leaves & Attendance</option>
              <option value="BENEFITS">Insurance & Benefits</option>
              <option value="WORKPLACE">Workplace Policy / HR</option>
              <option value="TECHNICAL">IT / System Access</option>
              <option value="OTHER">General Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium (Normal)</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Detailed Query / Message
          </label>
          <textarea
            rows={4}
            placeholder="Describe your query or request for HR..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-stone-950" />
            <span>{loading ? 'Submitting...' : 'Submit to HR'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTicketModal;
