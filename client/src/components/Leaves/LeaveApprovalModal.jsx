import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';

export function LeaveApprovalModal({ isOpen, onClose, leave, onSuccess }) {
  const { showToast } = useNotification();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!leave) return null;

  const handleAction = async (status) => {
    setLoading(true);
    try {
      const res = await api.updateLeaveStatus(leave.id, {
        status,
        admin_comment: comment,
      });
      if (res.success) {
        showToast(`Leave request #${leave.id} has been ${status.toLowerCase()}`, 'success');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Review Leave Application" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Applicant info card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <img
            src={leave.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={leave.employee_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <div className="font-bold text-slate-900 text-sm">{leave.employee_name}</div>
            <div className="text-xs text-slate-500">
              {leave.department} • <span className="font-mono">{leave.employee_id}</span>
            </div>
            <div className="mt-1">
              <Badge status={leave.status}>{leave.status}</Badge>
            </div>
          </div>
        </div>

        {/* Leave details */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Leave Type</span>
            <span className="font-bold text-slate-800 text-sm">{leave.leave_type} Leave</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Total Days</span>
            <span className="font-bold text-primary-700 text-sm">{leave.total_days} Day(s)</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">From Date</span>
            <span className="font-medium text-slate-800">{leave.start_date}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">To Date</span>
            <span className="font-medium text-slate-800">{leave.end_date}</span>
          </div>
        </div>

        {/* Reason */}
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Applicant's Reason:
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic">
            "{leave.reason}"
          </div>
        </div>

        {/* Admin Comments */}
        {leave.status === 'PENDING' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
              <span>Admin Comments / Approval Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Approved. Please ensure handoff to your team."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        ) : (
          leave.admin_comment && (
            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600">
              <b>Reviewer Notes:</b> {leave.admin_comment}
            </div>
          )
        )}

        {/* Action buttons */}
        {leave.status === 'PENDING' ? (
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('REJECTED')}
              className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('APPROVED')}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Request</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
