import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Mail, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export function ForgotPasswordModal({ isOpen, onClose }) {
  const { showToast } = useNotification();

  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [phonePreview, setPhonePreview] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      if (res.success) {
        setDemoOtp(res.demo_otp);
        setPhonePreview(res.phone_preview);
        setStep(2);
        showToast('OTP sent to your registered email & mobile', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
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
      const res = await api.resetPasswordWithOtp({
        email,
        otp: otp.trim(),
        newPassword,
      });

      if (res.success) {
        showToast(res.message, 'success');
        onClose();
        setStep(1);
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Forgot Password Verification" : "Verify OTP & Reset Password"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <p className="text-stone-500 leading-relaxed">
              Enter your registered work email. We will generate and send a 6-digit OTP to your email and registered mobile number.
            </p>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="name@dayflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {/* OTP Demo Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Simulated OTP Code
                </span>
                <span className="text-sm font-mono font-extrabold text-stone-900 mt-0.5 block tracking-widest">
                  {demoOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(demoOtp)}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Auto-fill OTP
              </button>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono text-center text-sm font-bold tracking-widest"
                required
              />
            </div>

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
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" />
                <span>{loading ? 'Resetting...' : 'Reset Password & Sign In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default ForgotPasswordModal;
