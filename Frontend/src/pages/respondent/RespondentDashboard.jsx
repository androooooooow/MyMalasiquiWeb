import { useState } from 'react';
import AppIcon from '../../components/AppIcon';
import DashboardShell from '../../components/DashboardShell';
import CommunicationsPage from './CommunicationsPage';
import DispatchPage from './DispatchPage';
import IncidentsPage from './IncidentsPage';
import OverviewPage from './OverviewPage';
import ProfilePage from './ProfilePage';
import TeamsPage from './TeamsPage';
import { NAV_ITEMS, RESPONDER_UNIT_LABELS } from './constants';
import useResponderOperations from './useResponderOperations';

export default function RespondentDashboard({ user, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState('overview');
  const {
    incidents,
    loading,
    error,
    busyId,
    loadQueue,
    acceptIncident,
    changeStatus,
  } = useResponderOperations(user);

  const unitLabel = RESPONDER_UNIT_LABELS[user.responder_unit] || 'Unit not assigned';
  const navItems = NAV_ITEMS.map((item) => (
    item.key === 'incidents'
      ? { ...item, badge: incidents.length ? String(incidents.length) : undefined }
      : item
  ));
  const incidentProps = {
    incidents,
    loading,
    busyId,
    onAccept: acceptIncident,
    onStatus: changeStatus,
  };

  function renderActivePage() {
    switch (activePage) {
      case 'incidents':
        return <IncidentsPage {...incidentProps} onRefresh={loadQueue} unitLabel={unitLabel} />;
      case 'dispatch':
        return <DispatchPage incidents={incidents} />;
      case 'teams':
        return <TeamsPage />;
      case 'messages':
        return <CommunicationsPage />;
      case 'profile':
        return <ProfilePage user={user} onUserUpdated={onUserUpdated} unitLabel={unitLabel} />;
      case 'overview':
      default:
        return <OverviewPage user={user} {...incidentProps} onNavigate={setActivePage} />;
    }
  }

  return (
    <DashboardShell
      user={user}
      roleLabel={`Responder · ${unitLabel}`}
      navItems={navItems}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={onLogout}
    >
      {error && <div className="emergency-error" role="alert"><AppIcon name="alert" size={18} /> {error}</div>}
      {renderActivePage()}
    </DashboardShell>
  );
}
