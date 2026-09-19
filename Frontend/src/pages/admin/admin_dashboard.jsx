import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import OverviewPage from './OverviewPage';
import UsersPage from './UsersPage';
import AnalyticsPage from './AnalyticsPage';
import AuditLogPage from './AuditLogPage';

const NAV_ITEMS = [
  { key: 'overview', label: 'Command center', icon: 'home' },
  { key: 'users', label: 'User management', icon: 'users' },
  { key: 'analytics', label: 'Incident analytics', icon: 'activity' },
  { key: 'audit', label: 'Audit log', icon: 'clipboard' },
];

export default function AdminDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('overview');
  const pages = {
    overview: <OverviewPage user={user} onNavigate={setActivePage} />,
    users: <UsersPage currentUserId={user.id} />,
    analytics: <AnalyticsPage />,
    audit: <AuditLogPage />,
  };

  return (
    <DashboardShell user={user} roleLabel="System administrator" navItems={NAV_ITEMS} activePage={activePage} onNavigate={setActivePage} onLogout={onLogout}>
      {pages[activePage] || pages.overview}
    </DashboardShell>
  );
}
