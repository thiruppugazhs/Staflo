import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Sliders, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export function LeaveLimitsModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [limits, setLimits] = useState({
    PAID: 18,
    SICK: 12,
    CASUAL: 10,
    UNPAID: 30,
  });

  const loadLimits = async () => {
    setFetching(true);
    try {
      const res = await api.getLeaveLimits();
      if (res.success && res.limits) {
        const map = { PAID: 18, SICK: 12, CASUAL: 10, UNPAID: 30 };
        res.limits.forEach((item) => {
          map[item.leave_type] = item.annual_limit;
        });
        setLimits(map);
      }
    } catch (err) {
      console.error('Failed to load leave limits:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLimits();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateLeaveLimits({ limits });
      if (res.success) {
        showToast('Annual leave allocation limits updated successfully', 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update leave limits', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Company Leave Limits & Policies"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-800">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Administrator Leave Allocation Quotas</span>
          </div>
          <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
            Set the maximum annual days employees are entitled to for each category. All employee leave balances and remaining days will automatically re-calculate based on these values.
          </p>
        </div>

        {fetching ? (
          <div className="p-8 text-center text-stone-400">Loading current limits...</div>
        ) : (
          <div className="space-y-3.5">
            {/* Paid Leave */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 block">Paid Leave (Vacation / Earned)</span>
                <span className="text-[11px] text-stone-400">Standard annual paid vacation entitlement</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={limits.PAID}
                  onChange={(e) => setLimits({ ...limits, PAID: parseInt(e.target.value, 10) || 0 })}
                  className="w-20 px-3 py-1.5 text-center font-bold text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <span className="text-stone-500 text-xs font-semibold">days / yr</span>
              </div>
            </div>

            {/* Sick Leave */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 block">Sick Leave (Medical)</span>
                <span className="text-[11px] text-stone-400">Health, illness, and doctor appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={limits.SICK}
                  onChange={(e) => setLimits({ ...limits, SICK: parseInt(e.target.value, 10) || 0 })}
                  className="w-20 px-3 py-1.5 text-center font-bold text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <span className="text-stone-500 text-xs font-semibold">days / yr</span>
              </div>
            </div>

            {/* Casual Leave */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 block">Casual Leave (Emergency)</span>
                <span className="text-[11px] text-stone-400">Short-notice family & urgent personal matters</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={limits.CASUAL}
                  onChange={(e) => setLimits({ ...limits, CASUAL: parseInt(e.target.value, 10) || 0 })}
                  className="w-20 px-3 py-1.5 text-center font-bold text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <span className="text-stone-500 text-xs font-semibold">days / yr</span>
              </div>
            </div>

            {/* Unpaid Leave */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 block">Unpaid Leave (LWP)</span>
                <span className="text-[11px] text-stone-400">Extended leave without pay allocation limit</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={limits.UNPAID}
                  onChange={(e) => setLimits({ ...limits, UNPAID: parseInt(e.target.value, 10) || 0 })}
                  className="w-20 px-3 py-1.5 text-center font-bold text-sm bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <span className="text-stone-500 text-xs font-semibold">days / yr</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || fetching}
            className="px-5 py-2 font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" />
            <span>{loading ? 'Saving Policy...' : 'Save Leave Limits'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default LeaveLimitsModal;
