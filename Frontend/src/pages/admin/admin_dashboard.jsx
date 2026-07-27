import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

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

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="dashboard-brand__mark" aria-hidden="true">✚</span>
          <span>Rescue App</span>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      {logoutError && <p className="logout-error" role="alert">{logoutError}</p>}

      <section className="dashboard-card" aria-labelledby="dashboard-title">
        <p className="dashboard-card__eyebrow">You are signed in</p>
        <h1 id="dashboard-title">Welcome, {user.name || 'there'}.</h1>
        <p>
          Your account is connected and ready for the next rescue feature.
        </p>
      </section>
    </main>
  );
}