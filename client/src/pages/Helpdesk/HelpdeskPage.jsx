import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { CreateTicketModal } from '../../components/Helpdesk/CreateTicketModal';
import { TicketDetailModal } from '../../components/Helpdesk/TicketDetailModal';

export function HelpdeskPage() {
  const { user, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;

      const res = await api.getHelpdeskTickets(params);
      if (res.success) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter]);

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(s) ||
      t.employee_name?.toLowerCase().includes(s) ||
      t.department?.toLowerCase().includes(s)
    );
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-amber-600" />
            <span>
              {isPrivileged
                ? isHr
                  ? `Department Helpdesk Inbox (${user?.department})`
                  : 'Company Support Helpdesk'
                : 'Employee Helpdesk & Queries'}
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isPrivileged
              ? 'Review employee inquiries, respond to tickets, and track resolution progress.'
              : 'Submit questions or requests regarding payroll, leaves, policies, and benefits to your HR team.'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-stone-950" />
          <span>Raise Support Query</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Awaiting Response (Open)</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{openCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">New incoming queries</div>
        </Card>

        <Card className="p-4">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Under active review</div>
        </Card>

        <Card className="p-4">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Resolved Queries</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Successfully closed</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by subject, employee, or dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="PAYROLL">Payroll</option>
              <option value="LEAVE">Leaves</option>
              <option value="BENEFITS">Benefits</option>
              <option value="WORKPLACE">Workplace</option>
              <option value="TECHNICAL">Technical</option>
              <option value="OTHER">General</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 uppercase text-xs font-bold text-stone-400 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                {isPrivileged && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={isPrivileged ? 7 : 6} className="py-10 text-center text-stone-400">
                    Loading helpdesk tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={isPrivileged ? 7 : 6} className="py-10 text-center text-stone-400">
                    No support queries found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="hover:bg-amber-50/20 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-stone-900 group-hover:text-amber-900 transition">
                          #{t.id} {t.subject}
                        </span>
                        <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-stone-400" />
                          <span>{t.department}</span>
                        </div>
                      </div>
                    </td>

                    {isPrivileged && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={t.employee_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                            alt={t.employee_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-stone-800">{t.employee_name}</div>
                            <div className="text-[10px] text-stone-400">{t.employee_id}</div>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-4 font-bold text-stone-700">
                      {t.category}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-900'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={t.status} size="sm">{t.status}</Badge>
                    </td>

                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <MessageSquare className="w-3 h-3" />
                        <span>{t.message_count || 1}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <CreateTicketModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={loadTickets}
        />
      )}

      {/* Ticket Detail / Messaging Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onRefresh={loadTickets}
        />
      )}
    </div>
  );
}

export default HelpdeskPage;
