const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dayflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPasswordWithOtp: (data) => request('/auth/reset-password-otp', { method: 'POST', body: JSON.stringify(data) }),

  // Employees Directory & Profile
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ''}`);
  },
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addDocument: (id, data) => request(`/employees/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance${query ? `?${query}` : ''}`);
  },
  getTodayAttendance: () => request('/attendance/today'),
  getAttendanceStats: () => request('/attendance/stats'),
  checkIn: (data = {}) => request('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: () => request('/attendance/check-out', { method: 'POST' }),
  manualAttendance: (data) => request('/attendance/manual', { method: 'POST', body: JSON.stringify(data) }),
  updateAttendance: (id, data) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Leaves
  getLeaves: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves${query ? `?${query}` : ''}`);
  },
  getLeaveBalances: (employeeId) => request(`/leaves/balances${employeeId ? `?employeeId=${employeeId}` : ''}`),
  applyLeave: (data) => request('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveStatus: (id, data) => request(`/leaves/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Payroll
  getPayroll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payroll${query ? `?${query}` : ''}`);
  },
  getSalarySlips: (employeeId) => request(`/payroll/slips${employeeId ? `?employeeId=${employeeId}` : ''}`),
  getSalarySlip: (id) => request(`/payroll/slips/${id}`),
  updateSalaryStructure: (employeeId, data) => request(`/payroll/structure/${employeeId}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateMonthlyPayroll: (data) => request('/payroll/generate-monthly', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsSummary: () => request('/analytics/summary'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Announcements
  getAnnouncements: () => request('/announcements'),
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Helpdesk & Support Queries
  getHelpdeskTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/helpdesk/tickets${query ? `?${query}` : ''}`);
  },
  createHelpdeskTicket: (data) => request('/helpdesk/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getHelpdeskTicket: (id) => request(`/helpdesk/tickets/${id}`),
  sendHelpdeskMessage: (id, data) => request(`/helpdesk/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  updateHelpdeskStatus: (id, data) => request(`/helpdesk/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
};
