import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  WalletCards,
  BarChart3,
  LogOut,
  Megaphone,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const { logout, isPrivileged } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Expanded if manually uncollapsed OR hovered over in collapsed mode
  const isExpanded = !isCollapsed || isHovered;

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: isPrivileged ? 'Workforce' : 'Team Directory',
      path: '/employees',
      icon: Users,
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: Clock,
    },
    {
      name: 'Leaves',
      path: '/leaves',
      icon: CalendarCheck,
    },
    {
      name: 'Payroll',
      path: '/payroll',
      icon: WalletCards,
    },
    {
      name: 'Announcements',
      path: '/announcements',
      icon: Megaphone,
    },
    {
      name: 'Helpdesk',
      path: '/helpdesk',
      icon: LifeBuoy,
    },
    ...(isPrivileged
      ? [
          {
            name: 'Reports',
            path: '/analytics',
            icon: BarChart3,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE DRAWER (< 768px screens)                           */}
      {/* ============================================================ */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-stone-700 flex flex-col md:hidden shadow-2xl border-r border-stone-200 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between border-b border-stone-100 min-h-[64px]">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="font-extrabold text-lg text-stone-900 tracking-tight">
              Daily<span className="text-amber-500 font-black">Flow</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer"
            title="Close Menu"
          >
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-2xl gap-3.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile Footer Sign Out */}
        <div className="p-3.5 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-stone-200 hover:border-rose-200 hover:bg-rose-50/60 text-xs font-medium text-red-600 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LAPTOP, DESKTOP & TABLET IN-FLOW SIDEBAR (>= 768px)       */}
      {/* ============================================================ */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={`hidden md:flex bg-white text-stone-700 flex-col shrink-0 min-h-screen border-r border-stone-200 select-none transition-all duration-300 ease-in-out sticky top-0 h-screen z-30 ${
          isExpanded ? 'w-60' : 'w-20'
        }`}
      >
        {/* Top Header */}
        <div className={`p-4 flex items-center ${!isExpanded ? 'justify-center flex-col gap-3' : 'justify-between'} border-b border-stone-100/80 min-h-[64px]`}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="font-extrabold text-lg text-stone-900 tracking-tight">
                  Daily<span className="text-amber-500 font-black">Flow</span>
                </span>
              </div>

              {/* Circular Toggle Button */}
              <button
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-full border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title={isCollapsed ? 'Pin expanded sidebar' : 'Collapse to mini rail'}
              >
                <ChevronLeft className={`w-4 h-4 text-stone-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </>
          ) : (
            <>
              <span className="font-extrabold text-base text-stone-900 tracking-tight">
                D<span className="text-amber-500 font-black">F</span>
              </span>
              <button
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-full border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 text-stone-600" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center transition-all duration-200 ${
                  !isExpanded
                    ? `w-11 h-11 mx-auto justify-center rounded-full ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                      }`
                    : `px-3.5 py-2.5 rounded-2xl gap-3.5 text-xs font-medium ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 font-semibold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      }`
                }`
              }
            >
              <item.icon className={`${!isExpanded ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
              {isExpanded && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sign Out Area */}
        <div className="p-3 border-t border-stone-100/80">
          {isExpanded ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-stone-200 hover:border-rose-200 hover:bg-rose-50/60 text-xs font-medium text-red-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-11 h-11 mx-auto flex items-center justify-center rounded-full border border-stone-200 hover:border-rose-200 hover:bg-rose-50/60 text-red-600 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
