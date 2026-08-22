import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { KeyRound, ShieldAlert, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ChangePasswordPage() {
  const { user, updateUserState } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    if (currentPassword && currentPassword === newPassword) {
      setError('New password cannot be identical to your temporary password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        showToast('Password updated successfully! Welcome to your dashboard.', 'success');
        if (user) {
          updateUserState({
            ...user,
            must_change_password: false,
          });
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfaf6] text-stone-900">
      <div className="max-w-md w-full bg-white p-7 sm:p-9 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Security Setup</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Create Permanent Password
          </h1>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Your account was initialized with your mobile number as a temporary password. Please set your new secure password to proceed.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Current Password <span className="text-amber-800 font-semibold lowercase">(your mobile number)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                placeholder="Enter your temporary mobile number password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
            <span>{loading ? 'Updating Password...' : 'Save Password & Enter Workspace'}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            Daily Flow by ORCESCALE • Secured Access
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
