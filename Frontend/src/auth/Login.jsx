import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from '../components/AuthLayout';
import { getRequestError, googleLogin, login, resendVerification } from '../api/auth';

function EyeIcon({ isOpen }) {
  return isOpen ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 4.9c5.5 0 9.3 5.1 9.8 6.1a1.9 1.9 0 0 1 0 1.8 16.7 16.7 0 0 1-3.1 3.9M6.5 6.5A16.4 16.4 0 0 0 2.2 11a1.9 1.9 0 0 0 0 1.8c.5 1 4.3 6.1 9.8 6.1 1.3 0 2.6-.3 3.7-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.2 12c.5-1 4.3-6.1 9.8-6.1s9.3 5.1 9.8 6.1a1.9 1.9 0 0 1 0 1.8c-.5 1-4.3 6.1-9.8 6.1s-9.3-5.1-9.8-6.1a1.9 1.9 0 0 1 0-1.8Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export default function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [notice, setNotice] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setUnverifiedEmail('');

    const credentials = {
      email: form.email.trim(),
      password: form.password,
    };

    if (!credentials.email || !credentials.password) {
      setError('Enter your email address and password to continue.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await login(credentials);
      onAuthenticated(data.user);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not sign you in. Please try again.'));
      if (requestError?.response?.data?.requiresVerification) {
        setUnverifiedEmail(requestError.response.data.email || credentials.email);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response) {
    setError('');
    try {
      const data = await googleLogin(response.credential);
      onAuthenticated(data.user);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getRequestError(requestError, 'Google sign-in was not completed.'));
    }
  }

  async function handleResend() {
    try {
      const data = await resendVerification(unverifiedEmail);
      setNotice(data.message);
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not resend the verification email.'));
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your account"
      description="Access your rescue dashboard and stay connected when every second counts."
      footer={
        <p>
          New to Malasiqui Rescue? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-alert" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}
        {notice && <div className="auth-notice" role="status">{notice}</div>}

        <label className="form-field" htmlFor="login-email">
          <span>Email address</span>
          <input
            className="auth-input"
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field" htmlFor="login-password">
          <span>Password</span>
          <div className="input-wrap">
            <input
              className="auth-input auth-input--password"
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((isVisible) => !isVisible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon isOpen={showPassword} />
            </button>
          </div>
        </label>

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        {unverifiedEmail && (
          <button className="auth-secondary" type="button" onClick={handleResend}>
            Resend verification email
          </button>
        )}

        <div className="auth-divider"><span>or continue with</span></div>
        {googleEnabled ? (
          <div className="google-button">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in was cancelled or unavailable.')}
              text="signin_with"
              shape="rectangular"
            />
          </div>
        ) : (
          <p className="auth-config-note">Google sign-in will appear after its client ID is configured.</p>
        )}
      </form>
    </AuthLayout>
  );
}
