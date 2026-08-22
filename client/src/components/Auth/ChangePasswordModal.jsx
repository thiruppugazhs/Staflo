import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { KeyRound, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { user, updateUserState } = useAuth();
  const { showToast } = useNotification();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword({ newPassword });
      if (res.success) {
        showToast(res.message, 'success');
        if (user) {
          updateUserState({ ...user, must_change_password: false });
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Non-dismissible until password changed
      title="Create Your Permanent Password"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <b>First Login Notice:</b> Your account was initialized with your mobile number as a temporary password. Please set a secure permanent password to protect your account.
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-stone-950" />
            <span>{loading ? 'Updating Password...' : 'Save Permanent Password'}</span>
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default ChangePasswordModal;
