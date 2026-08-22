// Normalize BASE_URL so it handles both 'https://app.onrender.com' and 'https://app.onrender.com/api'
const RAW_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const CLEAN_URL = RAW_URL.replace(/\/api$/, '');
const API_BASE = CLEAN_URL ? `${CLEAN_URL}/api` : '/api';

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
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, config);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            `Backend API not found at ${url}. Please verify VITE_API_BASE_URL on Vercel points to your Render backend URL.`
          );
        }
        if (res.status === 502 || res.status === 503) {
          throw new Error('Render backend server is waking up. Please wait 15-30 seconds and try again.');
        }
        throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
      }
      throw new Error('Received unexpected non-JSON response from server.');
    }

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
