import { useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import HomePage from './citizen/HomePage';
import ProfilePage from './citizen/ProfilePage';
import EmergencyPage from './citizen/EmergencyPage';
import KnowledgePage from './citizen/KnowledgePage';
import ChatsPage from './citizen/ChatsPage';

const NAV_ITEMS = [
  { key: 'home', label: 'Overview', icon: 'home' },
  { key: 'emergency', label: 'Emergency', icon: 'alert' },
  { key: 'knowledge', label: 'Safety guides', icon: 'book' },
  { key: 'chats', label: 'Messages', icon: 'chat', badge: '2' },
  { key: 'profile', label: 'My profile', icon: 'user' },
];

export default function CitizenDashboard({ user, onLogout, onUserUpdated }) {
  const [activePage, setActivePage] = useState('home');
  const pages = {
    home: <HomePage user={user} onNavigate={setActivePage} />,
    emergency: <EmergencyPage />,
    knowledge: <KnowledgePage />,
    chats: <ChatsPage />,
    profile: <ProfilePage user={user} onUserUpdated={onUserUpdated} />,
  };

  return (
    <DashboardShell
      user={user}
      roleLabel="Citizen account"
      navItems={NAV_ITEMS}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={onLogout}
      showEmergencyButton
    >
      {pages[activePage] || pages.home}
    </DashboardShell>
  );
}
