import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, Mail, Lock, Shield, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employee_id: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: 'Associate Engineer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      showToast('Registration successful! Welcome to Dayflow.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
      <div className="w-full max-w-lg bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-primary-600 items-center justify-center text-white font-black text-2xl mb-3 shadow-lg shadow-primary-600/30">
            D
          </div>
          <h2 className="text-2xl font-black tracking-tight">Create Dayflow Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Join your organization's Human Resource Management portal
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Employee ID (Optional)
              </label>
              <input
                type="text"
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                placeholder="e.g. EMP-101"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@dayflow.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Account Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">HR / Admin Officer</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-lg shadow-primary-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary-400 hover:text-primary-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
