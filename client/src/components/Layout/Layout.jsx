import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from '../Auth/ChangePasswordModal';

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  // Desktop collapse state (default expanded on large screens, collapsed on tablets)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  // Mobile open/close state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#fcfbf9] overflow-x-hidden text-stone-900">
      {/* Sidebar: In-flow for Laptop/Desktop/Tablet, Drawer for Mobile */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Navbar
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsMobileOpen((prev) => !prev);
            } else {
              setIsCollapsed((prev) => !prev);
            }
          }}
          isSidebarOpen={!isCollapsed}
        />
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Force Change Password on First Login */}
      {user?.must_change_password && (
        <ChangePasswordModal
          isOpen={!!user?.must_change_password}
          onClose={() => {}}
        />
      )}
    </div>
  );
}

export default Layout;
