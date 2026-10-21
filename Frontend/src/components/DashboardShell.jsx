import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import AppIcon from './AppIcon';
import EmergencyHotlinesModal from './EmergencyHotlinesModal';
import { ThemeToggle } from './ThemeProvider';
import '../styles/dashboard.css';

export default function DashboardShell({
  user,
  roleLabel,
  basePath,
  navItems,
  activePage,
  children,
  onLogout,
  showEmergencyButton = false,
}) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [showHotlines, setShowHotlines] = useState(false);
  const activeItem = navItems.find((item) => item.key === activePage) || navItems[0];
  const today = new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  async function handleLogout() {
    setLogoutError('');
    setIsLoggingOut(true);
    try {
      await logout();
      onLogout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('Sign out failed. Check your connection.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="rescue-shell">
      <a className="rescue-skip" href="#dashboard-main">Skip to content</a>

      <aside className={`rescue-sidebar${navOpen ? ' rescue-sidebar--open' : ''}`}>
        <div className="rescue-brand">
          <span className="rescue-brand__mark"><AppIcon name="shield" size={22} /></span>
          <span className="rescue-brand__copy">
            <strong>RESCUE APP</strong>
            <small>Malasiqui response network</small>
          </span>
          <button className="rescue-sidebar__close" type="button" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <AppIcon name="close" />
          </button>
        </div>

        <nav className="rescue-nav" aria-label="Dashboard navigation">
          <p className="rescue-nav__label">Workspace</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={`${basePath}/${item.path}`}
                  className={`rescue-nav__item${item.key === activePage ? ' rescue-nav__item--active' : ''}`}
                  onClick={() => setNavOpen(false)}
                  aria-current={item.key === activePage ? 'page' : undefined}
                >
                  <AppIcon name={item.icon} />
                  <span>{item.label}</span>
                  {item.badge && <span className="rescue-nav__badge">{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {showEmergencyButton && (
          <Link to={`${basePath}/emergency`} className="rescue-sos" onClick={() => setNavOpen(false)}>
            <span className="rescue-sos__icon"><AppIcon name="alert" size={18} /></span>
            <span><strong>Request rescue</strong><small>Send an in-app emergency</small></span>
          </Link>
        )}

        <div className="rescue-sidebar__footer">
          <div className="rescue-user">
            <span className="rescue-user__avatar">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
            <span className="rescue-user__copy">
              <strong>{user?.name || 'Rescue user'}</strong>
              <small>{roleLabel}</small>
            </span>
          </div>
          <button className="rescue-logout" type="button" onClick={handleLogout} disabled={isLoggingOut} aria-label="Sign out">
            <AppIcon name="logout" size={19} />
          </button>
          {logoutError && <p className="rescue-sidebar__error" role="alert">{logoutError}</p>}
        </div>
        <nav className="rescue-sidebar__legal" aria-label="Policies">
          <Link to="/terms" onClick={() => setNavOpen(false)}>Terms</Link>
          <Link to="/privacy" onClick={() => setNavOpen(false)}>Privacy</Link>
        </nav>
      </aside>

      <button className="rescue-scrim" type="button" hidden={!navOpen} onClick={() => setNavOpen(false)} aria-label="Close menu" />

      <div className="rescue-workspace">
        <header className="rescue-topbar">
          <div className="rescue-topbar__left">
            <button className="rescue-menu" type="button" onClick={() => setNavOpen(true)} aria-label="Open menu">
              <AppIcon name="menu" />
            </button>
            <div>
              <p className="rescue-breadcrumb">RESCUE APP / {roleLabel}</p>
              <h2>{activeItem?.label}</h2>
            </div>
          </div>
          <div className="rescue-topbar__right">
            <button
              className="rescue-hotline-btn"
              type="button"
              onClick={() => setShowHotlines(true)}
              title="Open official Malasiqui emergency telephone directory"
            >
              <AppIcon name="phone" size={14} />
              <span>Hotlines</span>
            </button>
            <span className="rescue-net-status" title="Connected to Malasiqui Response Network">
              <span className="rescue-net-dot" aria-hidden="true" />
              <span>Network live</span>
            </span>
            <span className="rescue-date">{today}</span>
            <ThemeToggle />
          </div>
        </header>

        <main className="rescue-main" id="dashboard-main">{children}</main>
      </div>

      <EmergencyHotlinesModal isOpen={showHotlines} onClose={() => setShowHotlines(false)} />
    </div>
  );
}
