import React, { useState } from 'react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Clock, CheckCircle2, User } from 'lucide-react';

export function AttendanceTable({ records = [], onRefresh }) {
  const { isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    check_in: '',
    check_out: '',
    status: 'PRESENT',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const openEdit = (rec) => {
    setEditingRecord(rec);
    setEditForm({
      check_in: rec.check_in || '09:00:00',
      check_out: rec.check_out || '17:30:00',
      status: rec.status || 'PRESENT',
      notes: rec.notes || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateAttendance(editingRecord.id, editForm);
      if (res.success) {
        showToast('Attendance record updated successfully', 'success');
        setEditingRecord(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider border-y border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Date</th>
            {isAdmin && <th className="py-3.5 px-4">Employee</th>}
            <th className="py-3.5 px-4">Check In</th>
            <th className="py-3.5 px-4">Check Out</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Notes</th>
            {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white font-medium">
          {records.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 6} className="text-center py-10 text-slate-400 text-sm">
                No attendance records found for this period.
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                  {new Date(rec.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                {isAdmin && (
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                        alt={rec.employee_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 leading-none">{rec.employee_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{rec.department} • {rec.employee_id}</div>
                      </div>
                    </div>
                  </td>
                )}
                <td className="py-3.5 px-4 font-mono text-slate-700">
                  {rec.check_in || <span className="text-slate-300">--:--</span>}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-700">
                  {rec.check_out || <span className="text-slate-300">--:--</span>}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-700">
                  {rec.duration_minutes > 0 ? (
                    `${Math.floor(rec.duration_minutes / 60)}h ${rec.duration_minutes % 60}m`
                  ) : (
                    <span className="text-slate-300">0h 0m</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <Badge status={rec.status}>{rec.status.replace('_', ' ')}</Badge>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                  {rec.notes || <span className="text-slate-300">—</span>}
                </td>
                {isAdmin && (
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openEdit(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition"
                      title="Edit attendance"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Admin Edit Attendance Modal */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={`Adjust Attendance for ${editingRecord.employee_name || 'Employee'}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div><b>Date:</b> {editingRecord.date}</div>
              <div><b>Current Status:</b> {editingRecord.status}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Check-In Time</label>
                <input
                  type="text"
                  placeholder="HH:MM:SS (e.g. 09:00:00)"
                  value={editForm.check_in}
                  onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Check-Out Time</label>
                <input
                  type="text"
                  placeholder="HH:MM:SS (e.g. 17:30:00)"
                  value={editForm.check_out}
                  onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
              >
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half-Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">Leave (Approved)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Reason</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="e.g. Manual override approved by HR manager"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20"
              >
                {submitting ? 'Saving...' : 'Save Adjustments'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
