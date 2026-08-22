import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout/Layout';

import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ChangePasswordPage } from './pages/Auth/ChangePasswordPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { EmployeeList } from './pages/Employees/EmployeeList';
import { EmployeeProfile } from './pages/Employees/EmployeeProfile';
import { AttendancePage } from './pages/Attendance/AttendancePage';
import { LeavesPage } from './pages/Leaves/LeavesPage';
import { PayrollPage } from './pages/Payroll/PayrollPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { AnnouncementsPage } from './pages/Announcements/AnnouncementsPage';
import { HelpdeskPage } from './pages/Helpdesk/HelpdeskPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-900 text-xs font-semibold">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Starting Daily Flow...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes inside Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/:id" element={<EmployeeProfile />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leaves" element={<LeavesPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="helpdesk" element={<HelpdeskPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
