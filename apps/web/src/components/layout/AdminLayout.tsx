import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ToastContainer } from '../ToastContainer';
import { JsoxAuditModal } from '../JsoxAuditModal';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sbifpt_sidebar_collapsed') === 'true';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sbifpt_sidebar_collapsed', String(next));
      return next;
    });
  };

  const sidebarWidth = isSidebarCollapsed ? 64 : 256;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-slate-100 font-sans overflow-x-hidden antialiased flex flex-col">
      {/* Desktop Fixed Left Sidebar */}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-[width] duration-200 ease-in-out select-none shadow-xs"
      >
        <AdminSidebar isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Mobile Drawer (Sheet Backdrop) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900 shadow-xl z-50 animate-fade-in">
            <div className="absolute top-3 right-3 z-50">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar
              isCollapsed={false}
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Right Column: Header + Main Content (Dynamic Left Padding for Desktop Fixed Sidebar) */}
      <div
        style={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}px` : undefined,
        }}
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-[padding-left] duration-200 ease-in-out',
          isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        {/* Enterprise Top Header */}
        <AdminHeader
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Main Content Area: High-Density, Full Width Enterprise Layout (No artificial max-w-7xl squeezing!) */}
        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 py-4 sm:py-6">
          {children}
        </main>

        {/* Crisp Enterprise Admin Footer */}
        <footer className="border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">SBI FPT</span>
              <span>·</span>
              <span>Tokyo Banking &amp; Enterprise IT Delivery Center (ODC)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 dark:text-slate-500">
              <span>FISC Security Standard</span>
              <span>·</span>
              <span>ISO/IEC 27001:2022</span>
              <span>·</span>
              <span>J-SOX 404 Compliant</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals & Toast Provider */}
      <JsoxAuditModal />
      <ToastContainer />
    </div>
  );
};
