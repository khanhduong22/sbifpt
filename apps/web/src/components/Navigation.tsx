import React from 'react';
import { useStore, TabType } from '../store/useStore';
import {
  TrendingUp,
  ShieldAlert,
  Sliders,
  Users,
  Link2,
} from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useStore();

  const tabs: TabItem[] = [
    {
      id: 'margin',
      label: 'Executive Margin',
      subLabel: 'Revenue & Margins',
      icon: TrendingUp,
      badge: '56.5%',
    },
    {
      id: 'odc',
      label: 'ODC Reconciliation',
      subLabel: 'Audit & Physical Swipes',
      icon: ShieldAlert,
      badge: 'J-SOX',
    },
    {
      id: 'slider',
      label: '10s Effort Slider',
      subLabel: 'Smart Allocation',
      icon: Sliders,
    },
    {
      id: 'roster',
      label: 'Resource Roster',
      subLabel: 'ODC Security Matrix',
      icon: Users,
      badge: '10 Staff',
    },
    {
      id: 'audit',
      label: 'Audit Chain',
      subLabel: 'Merkle SHA-256 Proof',
      icon: Link2,
    },
  ];

  return (
    <div className="w-full border-b border-slate-200 dark:border-navy-800 bg-white/50 dark:bg-navy-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-navy-800 text-white dark:bg-navy-800 dark:text-cyan-300 shadow-sm border border-slate-700/50 dark:border-cyan-500/30'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <div className="text-left">
                  <div className="font-semibold leading-tight">{tab.label}</div>
                </div>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
