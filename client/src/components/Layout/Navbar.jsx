import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  Shield,
  Calendar,
  ChevronDown,
  PanelLeft,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar } from '../Common/Avatar';

export function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, isAdmin, isHr, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.getTodayAttendance();
      if (res.success) {
        setTodayAttendance(res.record);
      }
    } catch (err) {
      console.error('Navbar attendance error:', err);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    const interval = setInterval(fetchTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickCheckIn = async () => {
    setCheckingInOut(true);
    try {
      const res = await api.checkIn({ notes: 'Navbar quick punch' });
      if (res.success) {
        setTodayAttendance(res.record);
        showToast('Checked in successfully at ' + res.record.check_in, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingInOut(false);
    }
  };

  const handleQuickCheckOut = async () => {
    setCheckingInOut(true);
    try {
      const res = await api.checkOut();
      if (res.success) {
        setTodayAttendance(res.record);
        showToast('Checked out successfully at ' + res.record.check_out, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingInOut(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Toggle button, Date & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
          title={isSidebarOpen ? 'Toggle sidebar' : 'Toggle sidebar'}
        >
          <PanelLeft className="w-4 h-4 hidden md:block" />
          <Menu className="w-4 h-4 md:hidden" />
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 py-1.5 px-3 rounded-lg border border-stone-200">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>{currentDateFormatted}</span>
        </div>
        <div className="text-xs sm:text-sm font-medium text-stone-700">
          Welcome, <span className="text-amber-800 font-semibold">{user?.name?.split(' ')[0]}</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Attendance Action Widget */}
        <div className="flex items-center">
          {!todayAttendance?.check_in ? (
            <button
              onClick={handleQuickCheckIn}
              disabled={checkingInOut}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 shadow-xs transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-stone-950" />
              <span>{checkingInOut ? 'Punching...' : 'Punch In'}</span>
            </button>
          ) : !todayAttendance?.check_out ? (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 pl-3 pr-1 py-1 rounded-xl">
              <span className="text-xs font-medium text-yellow-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                In: <b className="font-mono font-bold">{todayAttendance.check_in}</b>
              </span>
              <button
                onClick={handleQuickCheckOut}
                disabled={checkingInOut}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white transition ml-1"
              >
                {checkingInOut ? '...' : 'Punch Out'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Punched Out ({todayAttendance.duration_minutes || 0}m logged)</span>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50">
              <div className="p-3.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Notifications</h4>
                  <p className="text-[11px] text-stone-400">{unreadCount} unread alerts</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) {
                          navigate(notif.link);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-xs transition cursor-pointer hover:bg-stone-50 flex items-start gap-2.5 ${
                        notif.is_read ? 'opacity-60 bg-white' : 'bg-amber-50/50'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${
                          notif.is_read ? 'bg-stone-300' : 'bg-amber-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-[11px]">{notif.title}</div>
                        <p className="text-stone-600 text-[11px] mt-0.5 leading-snug">{notif.message}</p>
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition border border-transparent hover:border-stone-200 cursor-pointer"
          >
            <Avatar src={user?.avatar} name={user?.name} size="md" />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-stone-900 leading-none">{user?.name}</div>
              <div className="text-[10px] text-stone-400 font-semibold leading-none mt-1 uppercase">
                {user?.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-900">{user?.name}</p>
                <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                  {user?.role} • {user?.employee_id}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to={`/employees/${user?.id}`}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-amber-800 transition"
                >
                  <User className="w-4 h-4 text-stone-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/leaves"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-amber-800 transition"
                >
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span>Leave Requests</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-stone-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
