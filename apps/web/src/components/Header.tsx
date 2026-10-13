import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ShieldCheck,
  Sun,
  Moon,
  FileCheck2,
  Clock,
  Radio,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme, openJsoxModal } = useStore();
  const [time, setTime] = useState<{ jst: string; ict: string }>({ jst: '', ict: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        jst: now.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ict: now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-navy-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 border border-cyan-500/30 shadow-lg shadow-cyan-950/20 text-cyan-400 font-extrabold text-sm tracking-wider">
              SBI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                  SBI FPT
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Enterprise Delivery & ODC Governance
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tokyo - Hanoi High-Security ODC Gateway</span>
                <span className="hidden md:inline text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                  (FISC / ISO 27001 / J-SOX 404)
                </span>
              </p>
            </div>
          </div>

          {/* Right Area: Dual Clocks, J-SOX trigger, Theme toggle */}
          <div className="flex items-center gap-3">
            {/* Dual Time Zones: Tokyo (JST) & Hanoi (ICT) */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 text-xs font-mono text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[11px] text-slate-400">TYO (JST):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{time.jst || '--:--:--'}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">HAN (ICT):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{time.ict || '--:--:--'}</span>
              </div>
            </div>

            {/* J-SOX Proof Modal Quick Button */}
            <button
              onClick={openJsoxModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-700 hover:to-navy-800 text-cyan-300 border border-cyan-500/40 shadow-sm text-xs font-medium transition-all group"
              title="Open J-SOX 404 Cryptographic Audit Proof Pack"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">J-SOX 404 Proof</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-800 hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
