import React from 'react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ToastContainer } from './components/ToastContainer';
import { JsoxAuditModal } from './components/JsoxAuditModal';

// Views
import { ExecutiveMarginView } from './views/ExecutiveMarginView';
import { OdcReconcileView } from './views/OdcReconcileView';
import { EffortSliderView } from './views/EffortSliderView';
import { ResourceRosterView } from './views/ResourceRosterView';
import { AuditChainView } from './views/AuditChainView';

export const App: React.FC = () => {
  const { activeTab } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Enterprise Header */}
      <Header />

      {/* Tabs Navigation */}
      <Navigation />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'margin' && <ExecutiveMarginView />}
        {activeTab === 'odc' && <OdcReconcileView />}
        {activeTab === 'slider' && <EffortSliderView />}
        {activeTab === 'roster' && <ResourceRosterView />}
        {activeTab === 'audit' && <AuditChainView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">SBI FPT</span>
            <span>·</span>
            <span>Tokyo Banking &amp; Enterprise IT Delivery Center</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>FISC Financial Security Standard</span>
            <span>·</span>
            <span>ISO/IEC 27001:2022</span>
            <span>·</span>
            <span>J-SOX Section 404 Compliant</span>
          </div>
        </div>
      </footer>

      {/* Modals & Toasts */}
      <JsoxAuditModal />
      <ToastContainer />
    </div>
  );
};

export default App;
