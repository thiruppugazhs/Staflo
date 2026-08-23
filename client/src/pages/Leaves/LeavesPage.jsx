import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  CalendarCheck,
  Plus,
  Sliders
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { ApplyLeaveModal } from '../../components/Leaves/ApplyLeaveModal';
import { LeaveApprovalModal } from '../../components/Leaves/LeaveApprovalModal';
import { LeaveLimitsModal } from '../../components/Leaves/LeaveLimitsModal';

export function LeavesPage() {
  const { user, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tab, setTab] = useState('all');

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [leavesRes, balancesRes] = await Promise.all([
        api.getLeaves(params),
        api.getLeaveBalances(),
      ]);

      if (leavesRes.success) setLeaves(leavesRes.leaves);
      if (balancesRes.success) setBalances(balancesRes.balances);
    } catch (err) {
      console.error('Leaves load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  const filteredLeaves = leaves.filter((l) => {
    if (tab === 'all') return true;
    return l.status.toLowerCase() === tab.toLowerCase();
  });

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-amber-600" />
            <span>Time-Off & Leave Applications</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isPrivileged
              ? 'Review pending time-off requests, manage staff approvals, and inspect leave quotas.'
              : 'Submit time-off requests, monitor approval status, and check remaining quotas.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => setIsLimitsOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
              title="Configure Annual Leave Limits & Quotas"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Leave Quota Policy</span>
            </button>
          )}

          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Apply for Time-Off</span>
          </button>
        </div>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => (
          <Card key={b.code} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">{b.type}</span>
              <span className="text-[10px] font-bold uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                Quota: {b.total}
              </span>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2">
              {b.remaining} <span className="text-xs font-medium text-stone-400">days left</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (b.remaining / b.total) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-500 mt-2 font-medium">
              Used: <b className="text-stone-900">{b.used} days</b>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Leave Requests Table with Tab Navigation */}
      <Card className="p-0 overflow-hidden">
        {/* Sub-tabs Header */}
        <div className="p-3.5 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                tab === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Requests ({leaves.length})
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tab === 'pending'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-stone-950 text-white text-[10px] flex items-center justify-center font-black">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                tab === 'approved' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setTab('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                tab === 'rejected' ? 'bg-rose-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 uppercase text-xs font-bold text-stone-400 border-b border-stone-200">
              <tr>
                {isPrivileged && <th className="py-3 px-4">Member</th>}
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reviewer Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={isPrivileged ? 8 : 7} className="py-10 text-center text-stone-400">
                    Loading requests...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={isPrivileged ? 8 : 7} className="py-10 text-center text-stone-400">
                    No leave requests found in this category.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50/80 transition">
                    {isPrivileged && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={l.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                            alt={l.employee_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-stone-900">{l.employee_name}</div>
                            <div className="text-[10px] text-stone-400">{l.department}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4 font-bold text-stone-800">
                      {l.leave_type}
                    </td>
                    <td className="py-3 px-4 text-stone-700 whitespace-nowrap">
                      {l.start_date} → {l.end_date}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={l.status}>{l.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-500 max-w-[160px] truncate text-[11px]">
                      {l.admin_comment || <span className="text-stone-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPrivileged && l.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedLeave(l)}
                          className="text-amber-800 hover:underline font-bold text-xs cursor-pointer"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Leave Modal */}
      {isApplyOpen && (
        <ApplyLeaveModal
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSuccess={loadLeaves}
        />
      )}

      {/* Review / Details Modal */}
      {selectedLeave && (
        <LeaveApprovalModal
          isOpen={!!selectedLeave}
          onClose={() => setSelectedLeave(null)}
          leave={selectedLeave}
          onSuccess={loadLeaves}
        />
      )}

      {/* Admin Leave Limits Modal */}
      {isLimitsOpen && (
        <LeaveLimitsModal
          isOpen={isLimitsOpen}
          onClose={() => setIsLimitsOpen(false)}
          onSuccess={loadLeaves}
        />
      )}
    </div>
  );
}

export default LeavesPage;
