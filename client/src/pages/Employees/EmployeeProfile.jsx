import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  User,
  Briefcase,
  DollarSign,
  FileText,
  Clock,
  CalendarCheck,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  Upload,
  Download,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Avatar } from '../../components/Common/Avatar';
import { Modal } from '../../components/Common/Modal';
import { EditEmployeeModal } from '../../components/Employees/EditEmployeeModal';
import { EditSalaryModal } from '../../components/Payroll/EditSalaryModal';
import { Camera } from 'lucide-react';

export function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isHr, isPrivileged, updateUserState } = useAuth();
  const { showToast } = useNotification();

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditSalaryOpen, setIsEditSalaryOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', type: 'Contract', url: 'https://example.com/docs/file.pdf' });

  const targetId = id || currentUser?.id;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployee(targetId);
      if (res.success) {
        setEmployee(res.employee);
        setSalary(res.salary);
        setDocuments(res.documents || []);
        setAttendance(res.recentAttendance || []);
        setLeaves(res.recentLeaves || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addDocument(employee.id, docForm);
      if (res.success) {
        showToast('Document attached successfully', 'success');
        setDocuments([res.document, ...documents]);
        setIsUploadDocOpen(false);
        setDocForm({ title: '', type: 'Contract', url: 'https://example.com/docs/file.pdf' });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-stone-400">Loading record...</div>;
  }

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
        <User className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <h3 className="font-bold text-stone-800 text-sm">Member Not Found</h3>
        <button onClick={() => navigate('/employees')} className="mt-3 px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl">
          Back to Directory
        </button>
      </div>
    );
  }

  const isSelf = currentUser?.id === employee.id;
  const canEdit = isPrivileged || isSelf;

  const tabs = [
    { id: 'personal', label: 'Personal & Contact', icon: User },
    { id: 'job', label: 'Job & Hierarchy', icon: Briefcase },
    ...(isPrivileged || isSelf ? [{ id: 'salary', label: 'Compensation Structure', icon: DollarSign }] : []),
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'history', label: 'Activity Logs', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/employees')}
        className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar
                src={employee.avatar}
                name={employee.name}
                size="2xl"
                className="shadow-xs"
              />
              {canEdit && (
                <label
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-white shadow-md transition cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 3 * 1024 * 1024) {
                        showToast('Image size should be under 3MB', 'warning');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          const res = await api.updateEmployee(employee.id, { avatar: reader.result });
                          if (res.success) {
                            setEmployee(res.employee);
                            if (isSelf && updateUserState) {
                              updateUserState(res.employee);
                            }
                            showToast('Profile photo updated and saved to database', 'success');
                          }
                        } catch (err) {
                          showToast(err.message, 'error');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {employee.name}
                </h1>
                <span className="text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                  {employee.employee_id}
                </span>
                <Badge status={employee.role} size="sm">{employee.role}</Badge>
              </div>

              <div className="text-xs font-bold text-amber-900 mt-1">
                {employee.designation}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1.5">
                <div className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Joined: {employee.joining_date || '2023-01-01'}</span>
                </div>
              </div>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isPrivileged ? 'Edit Record' : 'Edit Contact Details'}</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mt-6 border-t border-stone-100 pt-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-400/20 text-amber-950 border border-amber-300 font-bold'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Contact Information">
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-stone-400 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-400 uppercase text-[10px]">Work Email</div>
                  <div className="font-semibold text-stone-800 text-xs mt-0.5">{employee.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-stone-400 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-400 uppercase text-[10px]">Phone Number</div>
                  <div className="font-semibold text-stone-800 text-xs mt-0.5">
                    {employee.phone || <span className="text-stone-400 italic">Not set</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-400 uppercase text-[10px]">Address</div>
                  <div className="font-semibold text-stone-800 text-xs mt-0.5">
                    {employee.address || <span className="text-stone-400 italic">Not set</span>}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Organization Identity">
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="font-bold text-stone-400 uppercase text-[10px]">Employee ID</div>
                <div className="font-mono font-bold text-stone-900 text-xs mt-0.5">{employee.employee_id}</div>
              </div>
              <div>
                <div className="font-bold text-stone-400 uppercase text-[10px]">Account Role</div>
                <div className="font-semibold text-stone-800 text-xs mt-0.5 flex items-center gap-2">
                  <Badge status={employee.role} size="sm">{employee.role}</Badge>
                </div>
              </div>
              <div>
                <div className="font-bold text-stone-400 uppercase text-[10px]">Account Status</div>
                <div className="font-semibold text-emerald-800 text-xs mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Active & Verified</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'job' && (
        <Card title="Employment Hierarchy & Department">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Department</span>
              <div className="font-bold text-stone-900 text-sm mt-1">{employee.department}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Designation</span>
              <div className="font-bold text-stone-900 text-sm mt-1">{employee.designation}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Status</span>
              <div className="mt-1">
                <Badge status={employee.status}>{employee.status}</Badge>
              </div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Date of Joining</span>
              <div className="font-bold text-stone-900 text-xs mt-1">{employee.joining_date || '2023-01-01'}</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Supervisory Chain</span>
              <div className="font-bold text-stone-900 text-xs mt-1">HR & Management</div>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 font-bold uppercase text-[10px]">Location</span>
              <div className="font-bold text-stone-900 text-xs mt-1">Corporate HQ</div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'salary' && (
        <Card
          title="Monthly Compensation Structure"
          action={
            isPrivileged && (
              <button
                onClick={() => setIsEditSalaryOpen(true)}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Adjust Structure</span>
              </button>
            )
          }
        >
          {salary ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 uppercase font-semibold text-[10px]">Basic Salary</span>
                  <div className="text-lg font-bold font-mono text-stone-900 mt-1">
                    ₹{salary.basic_salary?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 uppercase font-semibold text-[10px]">HRA</span>
                  <div className="text-lg font-bold font-mono text-stone-900 mt-1">
                    ₹{salary.hra?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 uppercase font-semibold text-[10px]">Allowances</span>
                  <div className="text-lg font-bold font-mono text-stone-900 mt-1">
                    ₹{salary.allowances?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 uppercase font-semibold text-[10px]">Deductions / Taxes</span>
                  <div className="text-lg font-bold font-mono text-rose-700 mt-1">
                    -₹{salary.deductions?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Net Banner */}
              <div className="p-5 bg-stone-900 rounded-xl text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Net Take-Home Pay</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">Monthly disbursement after deductions</div>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  ₹{salary.net_salary?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-400">
              Salary structure not configured yet.
            </div>
          )}
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card
          title="Attached Documents"
          action={
            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-stone-950" />
              <span>Attach File</span>
            </button>
          }
        >
          {documents.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-400">
              No files uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900 line-clamp-1">{doc.title}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {doc.type} • {doc.file_size || '1.2 MB'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200 text-right">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-800 font-bold text-xs hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Recent Attendance Logs">
            <div className="divide-y divide-stone-100 text-xs">
              {attendance.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No attendance logs.</div>
              ) : (
                attendance.map((att) => (
                  <div key={att.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-800">{att.date}</div>
                      <div className="text-stone-400 text-[10px] font-mono">
                        {att.check_in || '--:--'} → {att.check_out || '--:--'}
                      </div>
                    </div>
                    <Badge status={att.status} size="sm">{att.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recent Leave Requests">
            <div className="divide-y divide-stone-100 text-xs">
              {leaves.length === 0 ? (
                <div className="p-4 text-center text-stone-400">No leave history.</div>
              ) : (
                leaves.map((l) => (
                  <div key={l.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-800">
                        {l.leave_type} ({l.total_days} days)
                      </div>
                      <div className="text-stone-400 text-[10px]">
                        {l.start_date} to {l.end_date}
                      </div>
                    </div>
                    <Badge status={l.status} size="sm">{l.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      {isEditProfileOpen && (
        <EditEmployeeModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          employee={employee}
          onSuccess={loadProfile}
        />
      )}

      {isEditSalaryOpen && (
        <EditSalaryModal
          isOpen={isEditSalaryOpen}
          onClose={() => setIsEditSalaryOpen(false)}
          employee={{ ...employee, ...salary }}
          onSuccess={loadProfile}
        />
      )}

      {isUploadDocOpen && (
        <Modal
          isOpen={isUploadDocOpen}
          onClose={() => setIsUploadDocOpen(false)}
          title="Attach Document"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Document Title
              </label>
              <input
                type="text"
                placeholder="e.g. Identity Proof"
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={docForm.type}
                onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              >
                <option value="Contract">Employment Agreement</option>
                <option value="Identity">Government ID</option>
                <option value="Legal">NDA / Legal</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                File Link
              </label>
              <input
                type="url"
                value={docForm.url}
                onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsUploadDocOpen(false)}
                className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl"
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

export default EmployeeProfile;
