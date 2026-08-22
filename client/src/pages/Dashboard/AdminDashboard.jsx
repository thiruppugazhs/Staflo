import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Users,
  Clock,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Shield,
  UserPlus,
  Building,
  Megaphone,
  LifeBuoy
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { LeaveApprovalModal } from '../../components/Leaves/LeaveApprovalModal';
import { AddEmployeeModal } from '../../components/Employees/AddEmployeeModal';
import { CreateAnnouncementModal } from '../../components/Announcements/CreateAnnouncementModal';
import { TicketDetailModal } from '../../components/Helpdesk/TicketDetailModal';
import { Link, useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { user, isAdmin, isHr } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isPostAnnounceOpen, setIsPostAnnounceOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const loadData = async () => {
    try {
      const [analyticsRes, empRes, leavesRes, attRes, announceRes, ticketsRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getEmployees(),
        api.getLeaves({ status: 'PENDING' }),
        api.getAttendance({ date: new Date().toISOString().split('T')[0] }),
        api.getAnnouncements(),
        api.getHelpdeskTickets({ status: 'OPEN' }),
      ]);

      if (analyticsRes.success) setStats(analyticsRes.stats);
      if (empRes.success) setEmployees(empRes.employees);
      if (leavesRes.success) setPendingLeaves(leavesRes.leaves);
      if (attRes.success) setTodayAttendance(attRes.records);
      if (announceRes.success) setAnnouncements(announceRes.announcements.slice(0, 3));
      if (ticketsRes.success) setTickets(ticketsRes.tickets.slice(0, 4));
    } catch (err) {
      console.error('Admin dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hrCount = employees.filter((e) => e.role === 'HR').length;
  const staffCount = employees.filter((e) => e.role === 'EMPLOYEE').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>{isAdmin ? 'System Administrator Console' : `HR Operations (${user?.department || 'Department'})`}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Workforce Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            {isAdmin
              ? 'Executive controls: Onboard HR Officers and staff, broadcast company announcements, and supervise helpdesk requests.'
              : `HR Management: Onboard staff into the ${user?.department} department, review leave requests, and resolve employee queries.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-stone-950" />
            <span>{isAdmin ? 'Onboard Member (HR / Staff)' : `Onboard Employee (${user?.department})`}</span>
          </button>
          <button
            onClick={() => setIsPostAnnounceOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs border border-stone-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Megaphone className="w-4 h-4 text-stone-600" />
            <span>Post Notice</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Workforce</div>
              <div className="text-2xl font-black text-stone-900 mt-1">{employees.length}</div>
              <div className="text-[11px] text-stone-500 mt-1">
                {isAdmin ? (
                  <span><b>{hrCount}</b> HR • <b>{staffCount}</b> Staff</span>
                ) : (
                  <span><b>{staffCount}</b> Staff in {user?.department}</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Present Today</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{stats?.presentToday || 0}</div>
              <div className="text-[11px] text-stone-500 mt-1">
                Attendance rate: <b className="text-stone-900">{stats?.attendanceRate || 0}%</b>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Pending Leaves</div>
              <div className="text-2xl font-black text-amber-800 mt-1">{pendingLeaves.length}</div>
              <div className="text-[11px] text-stone-500 mt-1">
                Awaiting review
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-900 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Helpdesk Queries</div>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {tickets.length}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Open support tickets
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals & Helpdesk Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Approvals & Helpdesk Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Leave Approvals */}
          <Card
            title={`Pending Leave Approval Queue (${pendingLeaves.length})`}
            action={
              <Link to="/leaves" className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
                <span>View All Leaves</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {pendingLeaves.length === 0 ? (
              <div className="p-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-stone-800">Inbox Clear</div>
                <p className="text-[11px] text-stone-400 mt-0.5">No pending leave requests requiring review.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {pendingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={leave.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={leave.employee_name}
                        className="w-9 h-9 rounded-full object-cover border border-stone-200"
                      />
                      <div>
                        <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
                          <span>{leave.employee_name}</span>
                          <span className="text-[11px] font-normal text-stone-400">({leave.department})</span>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          <span className="font-semibold text-amber-900">{leave.leave_type} Leave</span>: {leave.start_date} → {leave.end_date} (<b>{leave.total_days} days</b>)
                        </div>
                        <p className="text-[11px] text-stone-400 italic mt-0.5 max-w-md truncate">
                          "{leave.reason}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLeave(leave)}
                      className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Helpdesk Queries Widget */}
          <Card
            title={`Helpdesk Support Inbox (${tickets.length} Open)`}
            action={
              <Link to="/helpdesk" className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
                <span>Go to Helpdesk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {tickets.length === 0 ? (
              <div className="p-6 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <LifeBuoy className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-stone-800">No open queries</div>
                <p className="text-[11px] text-stone-400 mt-0.5">Employee support requests will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="py-2.5 px-2 hover:bg-stone-50 rounded-xl flex items-center justify-between cursor-pointer group transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                        #{t.id} {t.subject}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        From: <b>{t.employee_name}</b> ({t.department}) • Category: {t.category}
                      </div>
                    </div>
                    <Badge status={t.status} size="sm">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Announcements & Quick Links */}
        <div className="space-y-6">
          {/* Active Announcements */}
          <Card
            title="Company Announcements"
            action={
              <Link to="/announcements" className="text-xs font-bold text-amber-800 hover:text-amber-900">
                All ({announcements.length})
              </Link>
            }
          >
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">No active announcements.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold mb-1">
                      <span className="text-amber-900 font-bold uppercase">{a.category}</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-bold text-stone-900">{a.title}</div>
                    <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Operations Card */}
          <Card title="Quick Operations">
            <div className="space-y-2">
              <Link
                to="/payroll"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-amber-50 hover:text-amber-900 text-stone-700 text-xs font-semibold transition border border-stone-100"
              >
                <span>Generate Monthly Payroll</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
              <Link
                to="/attendance"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-amber-50 hover:text-amber-900 text-stone-700 text-xs font-semibold transition border border-stone-100"
              >
                <span>Manual Timesheet Entry</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
              <Link
                to="/helpdesk"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-amber-50 hover:text-amber-900 text-stone-700 text-xs font-semibold transition border border-stone-100"
              >
                <span>Manage Helpdesk Queries</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Leave Approval Modal */}
      {selectedLeave && (
        <LeaveApprovalModal
          isOpen={!!selectedLeave}
          onClose={() => setSelectedLeave(null)}
          leave={selectedLeave}
          onSuccess={loadData}
        />
      )}

      {/* Add Employee Modal */}
      {isAddEmployeeOpen && (
        <AddEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Post Announcement Modal */}
      {isPostAnnounceOpen && (
        <CreateAnnouncementModal
          isOpen={isPostAnnounceOpen}
          onClose={() => setIsPostAnnounceOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
