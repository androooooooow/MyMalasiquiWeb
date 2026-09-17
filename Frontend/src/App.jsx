import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import CitizenDashboard from './pages/citizen_dashboard';
import RespondentDashboard from './pages/respondent/RespondentDashboard';
import AdminDashboard from './pages/admin/admin_dashboard';
import Login from './auth/Login';
import Register from './auth/Register';
import { CheckEmail, VerifyEmail } from './auth/EmailVerification';
import { fetchCurrentUser } from './api/auth';

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
    if (user.role === 'respondent') return '/respondent';
    if (user.role === 'citizen') return '/citizen';
    if (user.role === 'admin') return '/admin';
    return '/login';
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={homeRedirect()} replace />} />
        <Route
          path="/respondent"
          element={
            user?.role === 'respondent'
              ? <RespondentDashboard user={user} onUserUpdated={setUser} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/citizen"
          element={
            user?.role === 'citizen'
              ? <CitizenDashboard user={user} onUserUpdated={setUser} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin"
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
        <Route path="/check-email" element={user ? <Navigate to="/" replace /> : <CheckEmail onAuthenticated={setUser} />} />
        <Route path="/verify-email" element={user ? <Navigate to="/" replace /> : <VerifyEmail onAuthenticated={setUser} />} />
        <Route path="/Register" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to={homeRedirect()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
