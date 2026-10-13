import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = 'text-emerald-600';
        let borderStyle = 'border-emerald-200 dark:border-emerald-800';

        if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
          borderStyle = 'border-amber-200 dark:border-amber-800';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
          borderStyle = 'border-rose-200 dark:border-rose-800';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'text-blue-600';
          borderStyle = 'border-blue-200 dark:border-blue-800';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border bg-white dark:bg-gray-900 shadow-lg text-slate-800 dark:text-slate-100 transition-all duration-200 animate-fade-in ${borderStyle}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white text-xs tracking-tight mb-0.5">
                {toast.title}
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed break-words text-[11px]">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
