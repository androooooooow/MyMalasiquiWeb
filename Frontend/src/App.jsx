import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import CitizenDashboard from './pages/citizen_dashboard';
import RespondentDashboard from './pages/respondent/RespondentDashboard';
import AdminDashboard from './pages/admin/admin_dashboard';
import Login from './auth/Login';
import Register from './auth/Register';
import { CheckEmail, VerifyEmail } from './auth/EmailVerification';
import ForgotPassword from './auth/ForgotPassword';
import ResponderApplicationPending from './auth/ResponderApplicationPending';
import LegalPage from './pages/LegalPage';
import LandingPage from './pages/LandingPage';
import { fetchCurrentUser, logout, refreshSession } from './api/auth';
import { ThemeProvider } from './components/ThemeProvider';

const SESSION_IDLE_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 30 * 1000;

const previewRole = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('previewRole')
  : null;
const previewUser = ['citizen', 'respondent', 'admin'].includes(previewRole)
  ? {
      id: 0,
      name: 'Demo User',
      email: 'demo@rescue.local',
      phone_num: '0912 345 6789',
      address: 'Poblacion, Malasiqui, Pangasinan',
      role: previewRole,
      responder_unit: previewRole === 'respondent' ? 'MDRRMO' : null,
      created_at: new Date().toISOString(),
    }
  : null;

function App() {
  const [user, setUser] = useState(previewUser);
  const [loading, setLoading] = useState(!previewUser);

  useEffect(() => {
    if (previewUser) return;
    const fetchUser = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user || previewUser) return undefined;

    let lastActivityAt = Date.now();
    let lastRefreshAt = Date.now();
    let refreshInFlight = false;
    let signedOut = false;
    let disposed = false;
    let idleTimer;

    function expireSession() {
      if (signedOut || disposed) return;
      signedOut = true;
      setUser(null);
      // The server token also expires after five minutes, even if this tab is closed.
      logout().catch(() => {}).finally(() => {
        window.location.replace('/login?expired=1');
      });
    }

    function scheduleIdleCheck() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (Date.now() - lastActivityAt >= SESSION_IDLE_MS) expireSession();
        else scheduleIdleCheck();
      }, Math.max(0, SESSION_IDLE_MS - (Date.now() - lastActivityAt)));
    }

    function handleActivity() {
      if (signedOut) return;
      const now = Date.now();
      // A backgrounded tab may have delayed timers. Do not revive an idle session.
      if (now - lastActivityAt >= SESSION_IDLE_MS) {
        expireSession();
        return;
      }
      lastActivityAt = now;
      scheduleIdleCheck();

      if (!refreshInFlight && now - lastRefreshAt >= REFRESH_INTERVAL_MS) {
        refreshInFlight = true;
        refreshSession()
          .then(() => { lastRefreshAt = Date.now(); })
          .catch((error) => {
            if (error?.response?.status === 401 || error?.response?.status === 403) expireSession();
          })
          .finally(() => { refreshInFlight = false; });
      }
    }

    function checkOnReturn() {
      if (document.visibilityState === 'visible' && Date.now() - lastActivityAt >= SESSION_IDLE_MS) {
        expireSession();
      }
    }

    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', checkOnReturn);
    scheduleIdleCheck();
    // A page load is deliberate activity; renew a nearly expired cookie immediately.
    refreshSession()
      .then(() => { lastRefreshAt = Date.now(); })
      .catch((error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) expireSession();
      });

    return () => {
      disposed = true;
      window.clearTimeout(idleTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', checkOnReturn);
    };
  }, [user]);

  if (loading) {
    return (
      <main className="app-loading" aria-live="polite">
        <span className="app-loading__spinner" aria-hidden="true" />
        Checking your secure session…
      </main>
    );
  }

  function homeRedirect() {
    if (!user) return '/login';
    if (user.role === 'respondent') return '/respondent/operations';
    if (user.role === 'citizen') return '/citizen/overview';
    if (user.role === 'admin') return '/admin/command-center';
    return '/login';
  }

  return (
    <Router>
      <ThemeProvider authenticated={Boolean(user)}>
        <Routes>
        <Route path="/" element={user ? <Navigate to={homeRedirect()} replace /> : <LandingPage user={user} />} />
        <Route path="/welcome" element={<LandingPage user={user} />} />
        <Route
          path="/respondent/*"
          element={
            user?.role === 'respondent'
              ? <RespondentDashboard user={user} onUserUpdated={setUser} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/citizen/*"
          element={
            user?.role === 'citizen'
              ? <CitizenDashboard user={user} onUserUpdated={setUser} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/*"
          element={
            user?.role === 'admin'
              ? <AdminDashboard user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onAuthenticated={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/responder-application" element={user ? <Navigate to="/" replace /> : <ResponderApplicationPending />} />
        <Route path="/check-email" element={user ? <Navigate to="/" replace /> : <CheckEmail onAuthenticated={setUser} />} />
        <Route path="/verify-email" element={user ? <Navigate to="/" replace /> : <VerifyEmail onAuthenticated={setUser} />} />
        <Route path="/Register" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to={homeRedirect()} replace />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
