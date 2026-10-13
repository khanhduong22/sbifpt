import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let bgStyle = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200';
        let iconColor = 'text-emerald-400';

        if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bgStyle = 'bg-amber-950/90 border-amber-500/50 text-amber-200';
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bgStyle = 'bg-rose-950/90 border-rose-500/50 text-rose-200';
          iconColor = 'text-rose-400';
        } else if (toast.type === 'info') {
          Icon = Info;
          bgStyle = 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200';
          iconColor = 'text-cyan-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md shadow-2xl shadow-black/40 transition-all duration-200 animate-fade-in ${bgStyle}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-100 text-sm tracking-tight mb-0.5">
                {toast.title}
              </div>
              <div className="text-slate-300 leading-relaxed break-words font-mono text-[11px]">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
