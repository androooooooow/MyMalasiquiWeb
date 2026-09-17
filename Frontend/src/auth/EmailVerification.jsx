import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { getRequestError, resendVerification, verifyEmail } from '../api/auth';

export function CheckEmail({ onAuthenticated }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\d{6}$/.test(code)) {
      setError('Enter your email address and the 6-digit code from Gmail.');
      return;
    }

    try {
      setIsVerifying(true);
      const data = await verifyEmail(normalizedEmail, code);
      onAuthenticated?.(data.user);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not verify this code.'));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Enter your email address first.');
      return;
    }
    setIsSending(true);
    setError('');
    setStatus('');
    try {
      const data = await resendVerification(normalizedEmail);
      setStatus(data.message);
    } catch (requestError) {
      setError(getRequestError(requestError, 'We could not send a new code. Please try again.'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Secure your account"
      title="Verify your email"
      description="Enter the 6-digit verification code we sent to your Gmail. You cannot enter the dashboard until verification is complete."
      footer={<p>Already verified? <Link to="/login">Sign in</Link></p>}
    >
      <form className="auth-form verification-form" onSubmit={handleVerify}>
        {error && (
          <div className="auth-alert" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}
        {status && <div className="auth-notice" role="status">{status}</div>}

        <label className="form-field" htmlFor="verification-email">
          <span>Email address</span>
          <input
            className="auth-input"
            id="verification-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@gmail.com"
            required
          />
        </label>

        <label className="form-field" htmlFor="verification-code">
          <span>6-digit verification code</span>
          <input
            className="auth-input verification-code-input"
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            aria-describedby="verification-help"
            required
          />
        </label>
        <p id="verification-help" className="form-security-note">The code expires after 10 minutes.</p>

        <button className="auth-submit" type="submit" disabled={isVerifying || code.length !== 6}>
          {isVerifying ? 'Verifying…' : 'Verify and continue'}
        </button>
        <button className="auth-secondary" type="button" onClick={handleResend} disabled={isSending}>
          {isSending ? 'Sending…' : 'Send a new code'}
        </button>
      </form>
    </AuthLayout>
  );
}

// Keep the old route working for bookmarked verification pages.
export function VerifyEmail(props) {
  return <CheckEmail {...props} />;
}
