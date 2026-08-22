import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function AnalyticsPage() {
  const { showToast } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const res = await api.getAnalyticsSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Daily Flow HRMS - Organization Report\n\n';
    csvContent += 'Department,Headcount,Avg Salary (INR),Total Payroll (INR)\n';

    data.departmentDistribution?.forEach((d) => {
      csvContent += `${d.department},${d.employee_count},${Math.round(d.avg_salary || 0)},${d.total_payroll || 0}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dailyflow_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Organization report exported as CSV', 'success');
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-stone-400">Loading reports engine...</div>;
  }

  const COLORS = ['#eab308', '#ca8a04', '#a16207', '#78716c', '#059669', '#2563eb'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Executive Analytics & Reports</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time organizational insights, workforce trends, attendance tracking, and payroll expenditure analysis in Rupees (₹).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Attendance Rate</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{data?.stats?.attendanceRate || 0}%</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Today active rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Headcount</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{data?.stats?.totalStaff || 0}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Active personnel</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Monthly Payroll</div>
          <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">
            ₹{data?.stats?.totalMonthlyPayroll?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Total net disbursement</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Pending Leaves</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{data?.stats?.pendingLeaves || 0}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Awaiting HR review</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Weekly Attendance Trend Chart */}
        <Card title="Attendance Punch Volume (Past 7 Workdays)">
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyAttendance || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="present" name="Present" fill="#059669" radius={[3, 3, 0, 0]} />
                <Bar dataKey="half_day" name="Half-Day" fill="#eab308" radius={[3, 3, 0, 0]} />
                <Bar dataKey="leave" name="Leave" fill="#0284c7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#dc2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Department Headcount & Payroll Expenditure */}
        <Card title="Department Payroll Expenditure (₹)">
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.departmentDistribution || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="department" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => `₹${val?.toLocaleString('en-IN')}`}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="total_payroll" name="Monthly Total (₹)" fill="#ca8a04" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3. Department Headcount Breakdown */}
        <Card title="Personnel by Department">
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.departmentDistribution || []}
                  dataKey="employee_count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {(data?.departmentDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. Leave Types Distribution */}
        <Card title="Leave Types Taken (Month to Date)">
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.leaveTypeDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="leave_type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="days" name="Total Days" fill="#a16207" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
