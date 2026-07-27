import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import CitizenDashboard from './pages/citizen_dashboard';
import RespondentDashboard from './pages/respondent_dashboard';
import AdminDashboard from './pages/admin/admin_dashboard';
import Login from './auth/Login';
import Register from './auth/Register';
import { fetchCurrentUser } from './api/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
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
              ? <RespondentDashboard user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/citizen"
          element={
            user?.role === 'citizen'
              ? <CitizenDashboard user={user} onLogout={() => setUser(null)} />
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
          element={user ? <Navigate to="/" replace /> : <Register onAuthenticated={setUser} />}
        />
        <Route path="/Register" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to={homeRedirect()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;