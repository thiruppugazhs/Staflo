import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Megaphone,
  Plus,
  Trash2,
  Building,
  Calendar,
  Tag
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { CreateAnnouncementModal } from '../../components/Announcements/CreateAnnouncementModal';

export function AnnouncementsPage() {
  const { user, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.getAnnouncements();
      if (res.success) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.error('Fetch announcements error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await api.deleteAnnouncement(id);
      if (res.success) {
        showToast('Announcement deleted', 'success');
        setAnnouncements(announcements.filter((a) => a.id !== id));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'IMPORTANT':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'POLICY':
        return 'bg-stone-200 text-stone-900 border-stone-300 font-semibold';
      case 'EVENT':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 font-semibold';
      case 'HOLIDAY':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-amber-600" />
            <span>Company Announcements</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Official company news, policy updates, townhall schedules, and department broadcasts.
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <Megaphone className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <h3 className="font-bold text-stone-800 text-sm">No Announcements Yet</h3>
          <p className="text-xs text-stone-400 mt-1">Check back later for company updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const canDelete = isAdmin || a.author_id === user?.id;

            return (
              <div
                key={a.id}
                className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[11px] rounded border ${getCategoryColor(a.category)}`}>
                        {a.category}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        <Building className="w-3 h-3 text-stone-400" />
                        <span>{a.target_department === 'ALL' ? 'All Company' : `${a.target_department} Dept`}</span>
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                      {a.title}
                    </h2>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer self-start"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-stone-700 mt-3 leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>

                <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <img
                      src={a.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                      alt={a.author_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-semibold text-stone-800">{a.author_name}</span>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">({a.author_role})</span>
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <CreateAnnouncementModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={loadAnnouncements}
        />
      )}
    </div>
  );
}

export default AnnouncementsPage;
