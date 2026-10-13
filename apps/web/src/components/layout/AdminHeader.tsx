import React, { useEffect, useState } from 'react';
import { useStore, TabType } from '../../store/useStore';
import { cn } from '../../lib/utils';
import {
  Menu,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Clock,
  FileCheck2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenMobileMenu?: () => void;
}

const TAB_TITLES: Record<TabType, { title: string; category: string }> = {
  margin: {
    title: 'Biên lợi nhuận & Doanh thu',
    category: 'Executive Cockpit',
  },
  odc: {
    title: 'Đối soát Quẹt thẻ Turnstile vs WBS',
    category: 'J-SOX 404 & FISC Audit',
  },
  slider: {
    title: 'Smart Effort Allocation Slider (10s)',
    category: 'Developer Time Accounting',
  },
  roster: {
    title: 'Nhân sự & Phân quyền Phòng ODC',
    category: 'Workforce & Security Matrix',
  },
  audit: {
    title: 'Sổ cái Khối chuỗi Bất biến',
    category: 'SHA-256 Merkle Ledger',
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  isSidebarCollapsed = false,
  onOpenMobileMenu,
}) => {
  const { activeTab, theme, toggleTheme, openJsoxModal } = useStore();
  const [time, setTime] = useState<{ jst: string; ict: string }>({ jst: '', ict: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        jst: now.toLocaleTimeString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
        }),
        ict: now.toLocaleTimeString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: 'Dashboard',
    category: 'Delivery Governance',
  };

  return (
    <header className="h-14 lg:h-[60px] sticky top-0 z-30 w-full flex items-center justify-between px-3 sm:px-5 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 transition-colors">
      {/* Left: Sidebar Toggle + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Desktop Sidebar Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Mở rộng thanh menu bên' : 'Thu gọn thanh menu bên'}
            className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Mobile Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Enterprise Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
          <span className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer hidden sm:inline">
            Hệ thống
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          <span className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer hidden md:inline truncate">
            ODC Delivery Governance
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:inline" />
          <span className="font-semibold text-slate-900 dark:text-white truncate">
            {currentTabInfo.title}
          </span>
        </nav>
      </div>

      {/* Middle: Search Input (Desktop) */}
      <div className="hidden xl:flex items-center w-72 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm dự án, nhân viên, thẻ RFID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right: Telemetry chips, J-SOX proof, Theme toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Environment Chip */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Tokyo ODC · Live 24/7</span>
        </div>

        {/* Dual Clocks (Tokyo / Hanoi) */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <Clock className="w-3 h-3 text-blue-500" />
          <span className="text-slate-400">TYO:</span>
          <span className="font-semibold">{time.jst || '--:--'}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-400">HAN:</span>
          <span className="font-semibold">{time.ict || '--:--'}</span>
        </div>

        {/* J-SOX Proof Modal Quick Button */}
        <button
          onClick={openJsoxModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 shadow-2xs text-xs font-medium transition-colors"
          title="Xem chứng chỉ J-SOX 404 & FISC"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">J-SOX 404 Proof</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-750 transition-colors"
          aria-label="Toggle Theme"
          title="Chuyển chế độ sáng/tối"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-gray-800">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
            alt="User avatar"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-gray-700"
          />
          <div className="hidden sm:block text-left text-xs leading-none">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              K. Tanaka
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Director
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
