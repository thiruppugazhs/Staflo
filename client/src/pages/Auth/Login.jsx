import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ForgotPasswordModal } from '../../components/Auth/ForgotPasswordModal';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.must_change_password) {
        showToast('First login detected: Please set your permanent password', 'warning');
        navigate('/change-password');
      } else {
        showToast('Welcome to Daily Flow', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfaf6] text-stone-900">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 py-8">
        
        {/* Left Side: Only Daily Flow and by ORCESCALE */}
        <div className="flex-1 text-left md:pr-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Daily Flow
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-amber-700 mt-2">
            by ORCESCALE
          </p>
        </div>

        {/* Right Side: Clean Login Box */}
        <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-2xl border border-stone-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white placeholder:text-stone-400"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white placeholder:text-stone-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'View password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {isForgotOpen && (
        <ForgotPasswordModal
          isOpen={isForgotOpen}
          onClose={() => setIsForgotOpen(false)}
        />
      )}
    </div>
  );
}

export default Login;
