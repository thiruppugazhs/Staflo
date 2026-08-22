import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Mail, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export function ForgotPasswordModal({ isOpen, onClose }) {
  const { showToast } = useNotification();

  // 1: Request OTP (Email), 2: Verify OTP Code, 3: Set New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email: email.trim() });
      if (res.success) {
        setStep(2);
        showToast(`6-digit OTP code dispatched to ${email}`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code received in your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp({ email: email.trim(), otp: otp.trim() });
      if (res.success) {
        showToast('OTP verified successfully! Please choose your new password.', 'success');
        setStep(3);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
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
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.success) {
        showToast(res.message, 'success');
        handleClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return 'Forgot Password — Step 1 of 3';
    if (step === 2) return 'Verify Security OTP — Step 2 of 3';
    return 'Create New Password — Step 3 of 3';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Step Indicator Pills */}
        <div className="flex items-center gap-1.5 pb-1 border-b border-stone-100">
          <div className={`flex-1 h-1.5 rounded-full transition ${step >= 1 ? 'bg-amber-500' : 'bg-stone-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition ${step >= 2 ? 'bg-amber-500' : 'bg-stone-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition ${step >= 3 ? 'bg-amber-500' : 'bg-stone-200'}`} />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <p className="text-stone-600 leading-relaxed">
              Enter your registered work email address. We will send a secure 6-digit OTP code to verify your identity.
            </p>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="name@company.com"
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
                onClick={handleClose}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'Sending OTP...' : 'Send 6-Digit OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-stone-800">
              <span className="font-semibold block">Code sent to:</span>
              <span className="font-mono font-bold text-amber-950 text-xs">{email}</span>
              <p className="text-[11px] text-stone-500 mt-1">
                Please check your inbox (and spam folder) for the 6-digit verification code.
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Enter 6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-mono text-center text-sm font-bold tracking-widest"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
              >
                ← Back / Re-send
              </button>
              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" />
                <span>{loading ? 'Verifying...' : 'Verify OTP Code →'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Enter New Password (ONLY AFTER OTP IS VERIFIED) */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>OTP verified. Now create a secure new password for your account.</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" />
                <span>{loading ? 'Saving...' : 'Set New Password & Sign In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default ForgotPasswordModal;
