import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { getRequestError, resendVerification, verifyEmail } from '../api/auth';

export function CheckEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setIsSending(true);
    setStatus('');
    try {
      const data = await resendVerification(email);
      setStatus(data.message);
    } catch (error) {
      setStatus(getRequestError(error, 'We could not resend the email. Please try again.'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="One last step"
      title="Check your email"
      description={email ? `We sent a verification link to ${email}. Open it to activate your account.` : 'Open the verification link in your email to activate your account.'}
      footer={<p>Already verified? <Link to="/login">Sign in</Link></p>}
    >
      <div className="verification-card">
        <span className="verification-icon" aria-hidden="true">✓</span>
        <p>The link expires in 30 minutes. You cannot enter a dashboard until your email is verified.</p>
        {status && <p className="verification-status" role="status">{status}</p>}
        {email && (
          <button className="auth-secondary" type="button" onClick={handleResend} disabled={isSending}>
            {isSending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}
      </div>
    </AuthLayout>
  );
}

export function VerifyEmail({ onAuthenticated }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', message: 'Verifying your email…' });
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    const token = searchParams.get('token');
    if (!token) {
      setState({ status: 'error', message: 'This verification link is incomplete.' });
      return;
    }

    verifyEmail(token)
      .then((data) => {
        onAuthenticated(data.user);
        setState({ status: 'success', message: 'Your email is verified. Taking you to your dashboard…' });
        window.setTimeout(() => navigate('/', { replace: true }), 900);
      })
      .catch((error) => {
        setState({ status: 'error', message: getRequestError(error, 'We could not verify this email.') });
      });
  }, [navigate, onAuthenticated, searchParams]);

  return (
    <AuthLayout
      eyebrow="Email verification"
      title={state.status === 'success' ? 'Account verified' : state.status === 'error' ? 'Link not accepted' : 'Securing your account'}
      description={state.message}
      footer={state.status === 'error' ? <p><Link to="/login">Return to sign in</Link></p> : null}
    >
      <div className="verification-card verification-card--center" aria-live="polite">
        <span className={`verification-icon verification-icon--${state.status}`} aria-hidden="true">
          {state.status === 'loading' ? '' : state.status === 'success' ? '✓' : '!'}
        </span>
      </div>
    </AuthLayout>
  );
}
