import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
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
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/Common/Badge';
import { Avatar } from '../../components/Common/Avatar';
import { Modal } from '../../components/Common/Modal';
import { AddEmployeeModal } from '../../components/Employees/AddEmployeeModal';
import { useNavigate } from 'react-router-dom';

export function EmployeeList() {
  const { user: currentUser, isAdmin, isHr, isPrivileged } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // Default to list/table view
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeletePrompt = (emp, e) => {
    e.stopPropagation();
    setDeleteTarget(emp);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await api.deleteEmployee(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Record permanently deleted', 'success');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDelete = (emp) => {
    if (!isPrivileged) return false;
    if (emp.id === currentUser?.id) return false; // cannot delete own account
    if (isAdmin) return true;
    if (isHr) {
      if (emp.role === 'ADMIN' || emp.role === 'HR') return false;
      if (currentUser?.department && emp.department !== currentUser.department) return false;
      return true;
    }
    return false;
  };

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
              ? 'Oversee all organizational members, view profiles, assign roles, and manage staff records.'
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
              <span>{isAdmin ? 'Onboard Member' : 'Onboard Employee'}</span>
            </button>
          )}

          {/* View Toggle */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 border border-stone-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-800'
              }`}
              title="Grid Cards View"
            >
              <Grid className="w-4 h-4" />
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
            placeholder="Search by name, ID, email, or title..."
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

      {/* Employee List View (Table Format) or Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Loading directory...</div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <div className="font-bold text-stone-800 text-sm">No members found</div>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search criteria or add new members.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Clean List / Table View */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-stone-50 uppercase text-[10px] font-bold text-stone-400 border-b border-stone-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  {isPrivileged && <th className="py-3 px-4">Net Salary</th>}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-stone-50/80 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={emp.avatar} name={emp.name} size="sm" />
                        <div>
                          <div className="font-bold text-stone-900">{emp.name}</div>
                          <div className="text-[11px] text-stone-400 font-normal">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-700">
                      <span className="px-2 py-0.5 rounded bg-stone-100">{emp.employee_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={emp.role} size="sm">{emp.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-700 font-semibold">{emp.department}</td>
                    <td className="py-3 px-4 text-stone-600">{emp.designation}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.status === 'PROBATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    {isPrivileged && (
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        ₹{(emp.net_salary || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>

                        {canDelete(emp) && (
                          <button
                            onClick={(e) => handleDeletePrompt(emp, e)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-sm transition flex flex-col justify-between group"
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
                  <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {emp.employee_id}
                  </span>
                </div>

                <div className="text-xs text-amber-900 font-semibold mt-0.5">{emp.designation}</div>
                <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
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

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>

                {canDelete(emp) && (
                  <button
                    onClick={(e) => handleDeletePrompt(emp, e)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && deleteTarget && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
          title="Confirm Record Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Permanent Deletion Warning</span>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  Are you sure you want to permanently delete the profile for <b>{deleteTarget.name}</b> ({deleteTarget.employee_id})?
                  All associated attendance, leaves, tickets, and payroll records will be removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
                className="px-3.5 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </Modal>
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
