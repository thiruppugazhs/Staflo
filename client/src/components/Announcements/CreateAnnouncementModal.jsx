import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Megaphone } from 'lucide-react';

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const { user, isAdmin, isHr } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    target_department: isHr && user?.department ? user.department : 'ALL',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createAnnouncement(form);
      if (res.success) {
        showToast('Announcement posted successfully', 'success');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const departments = ['ALL', 'Engineering', 'Product & Design', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Post Company Announcement"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Announcement Title
          </label>
          <input
            type="text"
            placeholder="e.g. Q3 Townhall Meeting & Strategy Review"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Category Tag
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
            >
              <option value="GENERAL">General Notice</option>
              <option value="IMPORTANT">Important</option>
              <option value="POLICY">Policy Update</option>
              <option value="EVENT">Event / Meeting</option>
              <option value="HOLIDAY">Holiday Calendar</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Target Audience
            </label>
            {isAdmin ? (
              <select
                value={form.target_department}
                onChange={(e) => setForm({ ...form, target_department: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Company' : d}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={form.target_department}
                onChange={(e) => setForm({ ...form, target_department: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              >
                <option value={user?.department || 'ALL'}>{user?.department || 'My Department'}</option>
                <option value="ALL">All Company</option>
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Announcement Content
          </label>
          <textarea
            rows={4}
            placeholder="Write full announcement details..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{loading ? 'Publishing...' : 'Publish Announcement'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateAnnouncementModal;
