import React from 'react';
import { useStore } from './store/useStore';
import { AdminLayout } from './components/layout/AdminLayout';

// Views
import { ExecutiveMarginView } from './views/ExecutiveMarginView';
import { OdcReconcileView } from './views/OdcReconcileView';
import { EffortSliderView } from './views/EffortSliderView';
import { ResourceRosterView } from './views/ResourceRosterView';
import { AuditChainView } from './views/AuditChainView';

export const App: React.FC = () => {
  const { activeTab } = useStore();

  return (
    <AdminLayout>
      {activeTab === 'margin' && <ExecutiveMarginView />}
      {activeTab === 'odc' && <OdcReconcileView />}
      {activeTab === 'slider' && <EffortSliderView />}
      {activeTab === 'roster' && <ResourceRosterView />}
      {activeTab === 'audit' && <AuditChainView />}
    </AdminLayout>
  );
};

export default App;
