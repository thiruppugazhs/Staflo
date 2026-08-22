import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Clock,
  Calendar,
  Plus,
  Users
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { CheckInOutWidget } from '../../components/Attendance/CheckInOutWidget';
import { AttendanceTable } from '../../components/Attendance/AttendanceTable';
import { Modal } from '../../components/Common/Modal';

export function AttendancePage() {
  const { user, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewType, setViewType] = useState('daily');

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00:00',
    check_out: '17:30:00',
    status: 'PRESENT',
    notes: 'Manual entry',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (viewType === 'daily') {
        params.date = selectedDate;
      }
      if (selectedEmployee) params.employeeId = selectedEmployee;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const [attRes, statsRes] = await Promise.all([
        api.getAttendance(params),
        api.getAttendanceStats(),
      ]);

      if (attRes.success) setRecords(attRes.records);
      if (statsRes.success) setStats(statsRes.stats);

      if (isPrivileged && employees.length === 0) {
        const empRes = await api.getEmployees();
        if (empRes.success) setEmployees(empRes.employees);
      }
    } catch (err) {
      console.error('Attendance page error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedEmployee, selectedStatus, viewType]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.user_id) {
      showToast('Please select a member', 'warning');
      return;
    }
    try {
      const res = await api.manualAttendance(manualForm);
      if (res.success) {
        showToast('Manual entry saved successfully', 'success');
        setIsManualOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>Attendance & Timesheet Logs</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isPrivileged
              ? 'Supervise daily punch timestamps, timesheets, and manual adjustment records.'
              : 'Log daily shifts, verify working hours, and review personal punch history.'}
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => setIsManualOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Manual Timesheet Entry</span>
          </button>
        )}
      </div>

      {/* Live Punch Tracker Widget */}
      <CheckInOutWidget onAttendanceUpdated={loadData} />

      {/* KPI Stats Overview */}
      {isPrivileged && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Present Today</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{stats.present}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Half-Day</span>
            <div className="text-2xl font-black text-amber-800 mt-1">{stats.halfDay}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">On Approved Leave</span>
            <div className="text-2xl font-black text-sky-800 mt-1">{stats.leave}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{stats.attendanceRate}%</div>
          </div>
        </div>
      )}

      {/* Filter and View Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setViewType('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewType === 'daily' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewType === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Logs
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            {viewType === 'daily' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            {isPrivileged && (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="">All Members</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half-Day</option>
              <option value="LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-stone-400">Loading timesheets...</div>
        ) : (
          <AttendanceTable records={records} onRefresh={loadData} />
        )}
      </Card>

      {/* Manual Entry Modal */}
      {isManualOpen && (
        <Modal
          isOpen={isManualOpen}
          onClose={() => setIsManualOpen(false)}
          title="Manual Timesheet Punch"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Select Member
              </label>
              <select
                value={manualForm.user_id}
                onChange={(e) => setManualForm({ ...manualForm, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                required
              >
                <option value="">-- Choose Member --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_id} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Check-In
                </label>
                <input
                  type="text"
                  placeholder="09:00:00"
                  value={manualForm.check_in}
                  onChange={(e) => setManualForm({ ...manualForm, check_in: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Check-Out
                </label>
                <input
                  type="text"
                  placeholder="17:30:00"
                  value={manualForm.check_out}
                  onChange={(e) => setManualForm({ ...manualForm, check_out: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half-Day</option>
                <option value="LEAVE">Leave</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                rows={2}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Reason for manual entry..."
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsManualOpen(false)}
                className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AttendancePage;
