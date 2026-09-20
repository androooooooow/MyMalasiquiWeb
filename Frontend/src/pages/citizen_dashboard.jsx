import DashboardShell from '../components/DashboardShell';
import useDashboardRoute from '../hooks/useDashboardRoute';
import HomePage from './citizen/HomePage';
import ProfilePage from './citizen/ProfilePage';
import EmergencyPage from './citizen/EmergencyPage';
import KnowledgePage from './citizen/KnowledgePage';
import ChatsPage from './citizen/ChatsPage';

const NAV_ITEMS = [
  { key: 'home', path: 'overview', label: 'Overview', icon: 'home' },
  { key: 'emergency', path: 'emergency', label: 'Emergency', icon: 'alert' },
  { key: 'knowledge', path: 'safety-guides', label: 'Safety guides', icon: 'book' },
  { key: 'chats', path: 'messages', label: 'Messages', icon: 'chat' },
  { key: 'profile', path: 'profile', label: 'My profile', icon: 'user' },
];

export default function CitizenDashboard({ user, onLogout, onUserUpdated }) {
  const { activePage, onNavigate } = useDashboardRoute('/citizen', NAV_ITEMS);
  const pages = {
    home: <HomePage user={user} onNavigate={onNavigate} />,
    emergency: <EmergencyPage />,
    knowledge: <KnowledgePage />,
    chats: <ChatsPage user={user} />,
    profile: <ProfilePage user={user} onUserUpdated={onUserUpdated} />,
  };

  return (
    <DashboardShell
      user={user}
      roleLabel="Citizen account"
      basePath="/citizen"
      navItems={NAV_ITEMS}
      activePage={activePage}
      onLogout={onLogout}
      showEmergencyButton
    >
      {pages[activePage] || pages.home}
    </DashboardShell>
  );
}
