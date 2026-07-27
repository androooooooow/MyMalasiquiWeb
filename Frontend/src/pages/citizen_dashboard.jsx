import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import HomePage from './citizen/HomePage';
import ProfilePage from './citizen/ProfilePage';
import EmergencyPage from './citizen/EmergencyPage';
import KnowledgePage from './citizen/KnowledgePage';
import ChatsPage from './citizen/ChatsPage';
import './citizen_dashboard.css';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'profile', label: 'Profile', icon: ProfileIcon },
  { key: 'emergency', label: 'Emergency', icon: EmergencyIcon },
  { key: 'knowledge', label: 'Knowledge', icon: KnowledgeIcon },
  { key: 'chats', label: 'Chats', icon: ChatsIcon },
];

export default function CitizenDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('home');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  async function handleLogout() {
    setLogoutError('');
    setIsLoggingOut(true);

    try {
      await logout();
      onLogout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('We could not sign you out. Please check your connection and try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  function renderPage() {
    switch (activePage) {
      case 'profile':
        return <ProfilePage user={user} />;
      case 'emergency':
        return <EmergencyPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'chats':
        return <ChatsPage user={user} />;
      case 'home':
      default:
        return <HomePage user={user} onNavigate={setActivePage} />;
    }
  }

  const activeLabel = NAV_ITEMS.find((item) => item.key === activePage)?.label ?? 'Home';

  return (
    <div className="citizen-shell">
      <a href="#citizen-main" className="citizen-shell__skip">Skip to content</a>

      <aside className={`citizen-sidebar${navOpen ? ' citizen-sidebar--open' : ''}`}>
        <div className="dashboard-brand citizen-sidebar__brand">
          <span className="dashboard-brand__mark" aria-hidden="true">✚</span>
          <span className="citizen-sidebar__wordmark">Rescue App</span>
        </div>

        <nav className="citizen-nav" aria-label="Dashboard sections">
          <ul className="citizen-nav__list">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  className={`citizen-nav__item${activePage === key ? ' citizen-nav__item--active' : ''}`}
                  onClick={() => {
                    setActivePage(key);
                    setNavOpen(false);
                  }}
                  aria-current={activePage === key ? 'page' : undefined}
                >
                  <span className="citizen-nav__tick" aria-hidden="true" />
                  <Icon className="citizen-nav__icon" />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="citizen-sidebar__footer">
          <div className="citizen-sidebar__user">
            <span className="citizen-sidebar__avatar" aria-hidden="true">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </span>
            <div className="citizen-sidebar__userinfo">
              <span className="citizen-sidebar__username">{user?.name || 'Resident'}</span>
              <span className="citizen-sidebar__useremail">{user?.email}</span>
            </div>
          </div>
          <button
            className="logout-button citizen-sidebar__logout"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {logoutError && <p className="logout-error" role="alert">{logoutError}</p>}
        </div>
      </aside>

      <div className="citizen-sidebar__scrim" hidden={!navOpen} onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="citizen-main-column">
        <header className="citizen-topbar">
          <button
            type="button"
            className="citizen-topbar__menu"
            onClick={() => setNavOpen((open) => !open)}
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <p className="citizen-topbar__title">{activeLabel}</p>
        </header>

        <main className="citizen-main dashboard-page" id="citizen-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function ProfileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

function EmergencyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </svg>
  );
}

function KnowledgeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5c0-.8.7-1.4 1.5-1.3 2 .3 4.3 1 6.5 2.3 2.2-1.3 4.5-2 6.5-2.3.8-.1 1.5.5 1.5 1.3V17c0 .7-.6 1.3-1.3 1.4-2.2.3-4.6 1-6.7 2.3-2.1-1.3-4.5-2-6.7-2.3A1.4 1.4 0 0 1 4 17V5.5Z" />
      <path d="M12 6.5V19" />
    </svg>
  );
}

function ChatsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z" />
    </svg>
  );
}