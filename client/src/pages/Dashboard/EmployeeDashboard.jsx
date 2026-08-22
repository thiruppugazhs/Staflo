import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Clock,
  CalendarCheck,
  WalletCards,
  ArrowRight,
  CheckCircle2,
  FileText,
  Plus,
  Megaphone,
  LifeBuoy
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { CheckInOutWidget } from '../../components/Attendance/CheckInOutWidget';
import { ApplyLeaveModal } from '../../components/Leaves/ApplyLeaveModal';
import { SalarySlipModal } from '../../components/Payroll/SalarySlipModal';
import { CreateTicketModal } from '../../components/Helpdesk/CreateTicketModal';
import { TicketDetailModal } from '../../components/Helpdesk/TicketDetailModal';
import { Link } from 'react-router-dom';

export function EmployeeDashboard() {
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [latestSlip, setLatestSlip] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [myTickets, setMyTickets] = useState([]);

  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const loadEmployeeData = async () => {
    try {
      const [balancesRes, attRes, leavesRes, payrollRes, announceRes, ticketsRes] = await Promise.all([
        api.getLeaveBalances(),
        api.getAttendance(),
        api.getLeaves(),
        api.getPayroll(),
        api.getAnnouncements(),
        api.getHelpdeskTickets(),
      ]);

      if (balancesRes.success) setBalances(balancesRes.balances);
      if (attRes.success) setRecentAttendance(attRes.records.slice(0, 5));
      if (leavesRes.success) setRecentLeaves(leavesRes.leaves.slice(0, 4));
      if (announceRes.success) setAnnouncements(announceRes.announcements.slice(0, 2));
      if (ticketsRes.success) setMyTickets(ticketsRes.tickets.slice(0, 3));
      if (payrollRes.success) {
        setSalaryStructure(payrollRes.salary);
        if (payrollRes.slips && payrollRes.slips.length > 0) {
          setLatestSlip(payrollRes.slips[0]);
        }
      }
    } catch (err) {
      console.error('Employee dashboard load error:', err);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  const quickAccessCards = [
    {
      title: 'My Profile',
      desc: 'View personal details',
      icon: User,
      color: 'bg-amber-100 text-amber-900',
      path: `/employees/${user?.id}`,
    },
    {
      title: 'Timesheet & Hours',
      desc: 'Daily logs & clock-ins',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-900',
      path: '/attendance',
    },
    {
      title: 'Time-Off / Leaves',
      desc: 'Apply & check status',
      icon: CalendarCheck,
      color: 'bg-stone-200 text-stone-900',
      path: '/leaves',
    },
    {
      title: 'Payroll & Slips',
      desc: 'View & print pay slips',
      icon: WalletCards,
      color: 'bg-amber-200 text-amber-950',
      path: '/payroll',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Live Punch Tracker Widget */}
      <CheckInOutWidget onAttendanceUpdated={loadEmployeeData} />

      {/* Announcements Banner if any */}
      {announcements.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 shrink-0 mt-0.5">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100 px-1.5 py-0.2 rounded">
                  {announcements[0].category}
                </span>
                <span className="font-bold text-xs text-stone-900">{announcements[0].title}</span>
              </div>
              <p className="text-xs text-stone-700 mt-1 line-clamp-2">
                {announcements[0].content}
              </p>
            </div>
          </div>

          <Link
            to="/announcements"
            className="text-xs font-bold text-amber-900 hover:underline shrink-0 whitespace-nowrap self-end sm:self-center"
          >
            All Announcements →
          </Link>
        </div>
      )}

      {/* Quick-Access Cards */}
      <div>
        <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
          Quick Access Portal
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessCards.map((card) => (
            <Link
              key={card.title}
              to={card.path}
              className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 hover:shadow-xs transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-800 transition group-hover:translate-x-0.5" />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-xs">{card.title}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            My Time-Off Balances
          </div>
          <button
            onClick={() => setIsApplyLeaveOpen(true)}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map((b) => (
            <Card key={b.code} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">{b.type}</span>
                <span className="text-[10px] font-bold uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                  {b.used}/{b.total} Used
                </span>
              </div>
              <div className="text-2xl font-black text-stone-900 mt-2">
                {b.remaining} <span className="text-xs font-medium text-stone-400">days left</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (b.remaining / b.total) * 100)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Two Column Section: Recent Attendance & Helpdesk Queries / Salary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Recent Timesheet Activity"
            action={
              <Link to="/attendance" className="text-xs font-bold text-amber-800 hover:text-amber-900">
                Full Log
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 uppercase font-bold text-stone-400 border-b border-stone-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {recentAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400">
                        No recent attendance logged.
                      </td>
                    </tr>
                  ) : (
                    recentAttendance.map((att) => (
                      <tr key={att.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 font-semibold text-stone-800">
                          {new Date(att.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{att.check_in || '--:--'}</td>
                        <td className="py-2.5 px-3 font-mono">{att.check_out || '--:--'}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {att.duration_minutes > 0
                            ? `${Math.floor(att.duration_minutes / 60)}h ${att.duration_minutes % 60}m`
                            : '0m'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge status={att.status} size="sm">{att.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* My Helpdesk Queries */}
          <Card
            title="My HR Support Queries"
            action={
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Raise Query</span>
              </button>
            }
          >
            {myTickets.length === 0 ? (
              <div className="p-5 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-400">
                You have no active support queries. Need help with payroll or leaves? Click Raise Query.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {myTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-stone-50 rounded-lg px-2 transition"
                  >
                    <div>
                      <div className="font-bold text-stone-900">
                        #{t.id} {t.subject}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Category: {t.category} • {t.message_count || 1} messages
                      </div>
                    </div>
                    <Badge status={t.status} size="sm">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right side: Salary Preview & Holidays */}
        <div className="space-y-6">
          {/* Salary Summary Card */}
          <Card title="Monthly Compensation Overview">
            {salaryStructure ? (
              <div className="space-y-3 text-xs">
                <div className="bg-stone-900 text-white p-4 rounded-xl">
                  <div className="text-[10px] uppercase font-semibold text-stone-400">Net Monthly Salary</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    ₹{salaryStructure.net_salary?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-stone-600">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-mono font-semibold text-stone-900">₹{salaryStructure.basic_salary?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA + Allowances:</span>
                    <span className="font-mono font-semibold text-stone-900">
                      ₹{((salaryStructure.hra || 0) + (salaryStructure.allowances || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Deductions / Taxes:</span>
                    <span className="font-mono font-semibold">-₹{salaryStructure.deductions?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {latestSlip && (
                  <button
                    onClick={() => setSelectedSlip(latestSlip)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-stone-100 text-stone-800 hover:bg-amber-50 hover:text-amber-900 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>View Latest Pay Slip ({latestSlip.month} {latestSlip.year})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-stone-400">Salary structure not configured yet.</div>
            )}
          </Card>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyLeaveOpen}
        onClose={() => setIsApplyLeaveOpen(false)}
        onSuccess={loadEmployeeData}
      />

      {/* Create Ticket Modal */}
      {isCreateTicketOpen && (
        <CreateTicketModal
          isOpen={isCreateTicketOpen}
          onClose={() => setIsCreateTicketOpen(false)}
          onSuccess={loadEmployeeData}
        />
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onRefresh={loadEmployeeData}
        />
      )}

      {/* Salary Slip Modal */}
      {selectedSlip && (
        <SalarySlipModal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          slip={{
            ...selectedSlip,
            employee_name: user?.name,
            employee_id: user?.employee_id,
            department: user?.department,
            designation: user?.designation,
          }}
        />
      )}
    </div>
  );
}

export default EmployeeDashboard;
