import React from 'react';
import { useStore, TabType } from '../../store/useStore';
import { cn } from '../../lib/utils';
import {
  TrendingUp,
  ShieldCheck,
  Sliders,
  Users,
  Link2,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

interface NavItem {
  id: TabType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed = false,
  onItemClick,
  className,
}) => {
  const { activeTab, setActiveTab, openJsoxModal } = useStore();

  const navItems: NavItem[] = [
    {
      id: 'margin',
      title: 'Dashboard & Margin',
      subtitle: 'Biên lợi nhuận & Doanh thu',
      icon: TrendingUp,
      badge: '56.5%',
      badgeVariant: 'success',
    },
    {
      id: 'odc',
      title: 'ODC Turnstile Reconcile',
      subtitle: 'Đối soát quẹt thẻ vs WBS',
      icon: ShieldAlert,
      badge: 'J-SOX',
      badgeVariant: 'warning',
    },
    {
      id: 'slider',
      title: 'Smart Effort Slider',
      subtitle: 'Thanh trượt log công 10s',
      icon: Sliders,
      badge: '10s',
      badgeVariant: 'info',
    },
    {
      id: 'roster',
      title: 'Nhân sự & Thẻ ODC',
      subtitle: 'Resource & RFID Roster',
      icon: Users,
      badge: '10 Staff',
      badgeVariant: 'default',
    },
    {
      id: 'audit',
      title: 'Sổ cái Audit J-SOX',
      subtitle: 'Cryptographic Block Chain',
      icon: Link2,
      badge: 'SHA-256',
      badgeVariant: 'info',
    },
  ];

  return (
    <aside
      className={cn(
        'h-full flex flex-col bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 transition-all duration-200 select-none overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-14 lg:h-[60px] flex items-center px-4 border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-sm shrink-0 border border-blue-800">
            SBI
          </div>
          {!isCollapsed && (
            <div className="truncate min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  SBI FPT Admin
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Tokyo ODC
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Delivery Governance Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!isCollapsed && (
          <div className="px-2.5 pb-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Phân hệ Quản trị & Đối soát
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onItemClick) onItemClick();
              }}
              title={isCollapsed ? `${item.title} - ${item.subtitle}` : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors group relative',
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-gray-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-gray-800/60 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-gray-600'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1 truncate">
                  <div className="truncate text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={cn(
                    'ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 border',
                    item.badgeVariant === 'success' &&
                      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
                    item.badgeVariant === 'warning' &&
                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
                    item.badgeVariant === 'info' &&
                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
                    item.badgeVariant === 'default' &&
                      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:border-gray-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Audit Quick Action */}
        {!isCollapsed && (
          <div className="pt-3 px-2 border-t border-slate-200 dark:border-gray-800 mt-3">
            <button
              onClick={openJsoxModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>J-SOX 404 Chứng chỉ</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer with Simulated User Profile */}
      <div className="p-3 border-t border-slate-200 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-950/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
              alt="Kenjiro Tanaka"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-gray-700"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1 truncate">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                Kenjiro Tanaka
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                <span>Executive Director</span>
                <span>·</span>
                <span>SBI ODC</span>
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-gray-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span>FISC ISO-27001</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live 24/7
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
