import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../Common/Avatar';
import { Upload, X } from 'lucide-react';

export function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const { isAdmin, isHr, user, updateUserState } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: '',
    department: '',
    designation: '',
    status: 'ACTIVE',
    role: 'EMPLOYEE',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        phone: employee.phone || '',
        address: employee.address || '',
        avatar: employee.avatar || '',
        department: employee.department || 'Engineering',
        designation: employee.designation || 'Staff',
        status: employee.status || 'ACTIVE',
        role: employee.role || 'EMPLOYEE',
      });
    }
  }, [employee]);

  if (!employee) return null;

  const isSelf = user?.id === employee.id;
  const isPrivileged = isAdmin || isHr;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size should be less than 3MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateEmployee(employee.id, form);
      if (res.success) {
        showToast('Profile updated successfully', 'success');
        if (isSelf) {
          updateUserState(res.employee);
        }
        onClose();
        if (onSuccess) onSuccess(res.employee);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPrivileged ? `Edit Record: ${employee.name}` : 'Edit My Profile'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Profile Photo Uploader Section */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-4">
          <Avatar src={form.avatar} name={form.name || employee.name} size="xl" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-stone-900 block text-xs">Profile Picture</span>
            <p className="text-[11px] text-stone-400 mt-0.5">Upload a photo directly from your device (JPG, PNG, WebP up to 3MB)</p>
            <div className="flex items-center gap-2 mt-2">
              <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Media</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
              {form.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 text-stone-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {!isPrivileged && (
          <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs">
            <b>Self-Service Note:</b> You can update your contact phone, residential address, and profile photo. Role and designation changes require HR/Admin approval.
          </div>
        )}

        {isPrivileged && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                {isAdmin ? (
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value="EMPLOYEE">Standard Employee</option>
                    <option value="HR">HR Officer</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 font-semibold">
                    {employee.role}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Designation / Job Title
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Employment Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Phone Number
          </label>
          <input
            type="text"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Residential / Mailing Address
          </label>
          <textarea
            rows={2}
            placeholder="123 Street Name, City, State, ZIP"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 font-bold text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditEmployeeModal;
