import DashboardShell from '../../components/DashboardShell';
import useDashboardRoute from '../../hooks/useDashboardRoute';
import OverviewPage from './OverviewPage';
import UsersPage from './UsersPage';
import AnalyticsPage from './AnalyticsPage';
import AuditLogPage from './AuditLogPage';
import ResponderApplicationsPage from './ResponderApplicationsPage';

const NAV_ITEMS = [
  { key: 'overview', path: 'command-center', label: 'Command center', icon: 'home' },
  { key: 'users', path: 'user-management', label: 'User management', icon: 'users' },
  { key: 'applications', path: 'responder-approvals', label: 'Responder approvals', icon: 'shield' },
  { key: 'analytics', path: 'incident-analytics', label: 'Incident analytics', icon: 'activity' },
  { key: 'audit', path: 'audit-log', label: 'Audit log', icon: 'clipboard' },
];

export default function AdminDashboard({ user, onLogout }) {
  const { activePage, onNavigate } = useDashboardRoute('/admin', NAV_ITEMS);
  const pages = {
    overview: <OverviewPage user={user} onNavigate={onNavigate} />,
    users: <UsersPage currentUserId={user.id} />,
    applications: <ResponderApplicationsPage />,
    analytics: <AnalyticsPage />,
    audit: <AuditLogPage />,
  };

  return (
    <DashboardShell user={user} roleLabel="System administrator" basePath="/admin" navItems={NAV_ITEMS} activePage={activePage} onLogout={onLogout}>
      {pages[activePage] || pages.overview}
    </DashboardShell>
  );
}
