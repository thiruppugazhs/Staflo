import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Building,
  ChevronRight,
  Grid,
  List,
  Shield
} from 'lucide-react';
import { Badge } from '../../components/Common/Badge';
import { Avatar } from '../../components/Common/Avatar';
import { AddEmployeeModal } from '../../components/Employees/AddEmployeeModal';
import { useNavigate } from 'react-router-dom';

export function EmployeeList() {
  const { isAdmin, isHr, isPrivileged } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department !== 'ALL') params.department = department;
      if (roleFilter !== 'ALL') params.role = roleFilter;

      const res = await api.getEmployees(params);
      if (res.success) {
        setEmployees(res.employees);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, department, roleFilter]);

  const departments = ['ALL', 'Engineering', 'Product & Design', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Executive Management'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-600" />
            <span>Workforce Directory</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {isAdmin
              ? 'Oversee all organizational members, assign roles (HR Officers & Employees), and manage staff records.'
              : isHr
              ? 'Onboard and manage employee records, contact details, and department allocations.'
              : 'Browse team members across departments and view company contact info.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isPrivileged && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-950" />
              <span>{isAdmin ? 'Onboard Member (HR / Staff)' : 'Onboard Employee'}</span>
            </button>
          )}

          {/* View Toggle */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-400 hover:text-stone-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-400 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          {isPrivileged && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="HR">HR Officers</option>
              <option value="EMPLOYEE">Employees</option>
            </select>
          )}

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee List Grid or Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Loading directory...</div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <div className="font-bold text-stone-800 text-sm">No members found</div>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search criteria or add new members.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <Avatar src={emp.avatar} name={emp.name} size="xl" />
                  <Badge status={emp.role} size="sm">{emp.role}</Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-900 transition">
                    {emp.name}
                  </h3>
                  <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                    {emp.employee_id}
                  </span>
                </div>

                <div className="text-xs text-amber-900 font-medium mt-0.5">{emp.designation}</div>
                <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-stone-400" />
                  <span>{emp.department}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate text-[11px]">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="text-[11px]">{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
                <span>View Full Record</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 uppercase text-xs font-bold text-stone-400 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                {isPrivileged && <th className="py-3 px-4">Net Salary</th>}
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-xs">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-stone-50/80 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={emp.avatar} name={emp.name} size="sm" />
                      <div>
                        <div className="font-bold text-stone-900">{emp.name}</div>
                        <div className="text-[10px] text-stone-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-600">{emp.employee_id}</td>
                  <td className="py-3 px-4">
                    <Badge status={emp.role} size="sm">{emp.role}</Badge>
                  </td>
                  <td className="py-3 px-4 text-stone-700">{emp.department}</td>
                  <td className="py-3 px-4 text-stone-700">{emp.designation}</td>
                  {isPrivileged && (
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      ${emp.net_salary?.toLocaleString() || '0'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right text-amber-800 font-bold">
                    Profile →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddOpen && (
        <AddEmployeeModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}

export default EmployeeList;
