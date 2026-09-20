import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { getRequestError, requestPasswordReset, resetPassword } from '../api/auth';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function handleRequest(event) {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    setStatus('');
    if (!normalizedEmail) { setError('Enter your email address.'); return; }
    try {
      setBusy(true);
      const data = await requestPasswordReset(normalizedEmail);
      setEmail(normalizedEmail);
      setStatus(data.message);
      setStep('reset');
      setResendIn(60);
    } catch (requestError) {
      setError(getRequestError(requestError, 'Could not request a reset code. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code from your email.'); return; }
    if (newPassword.length < 8 || newPassword.length > 72 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Use 8–72 characters with uppercase and lowercase letters and a number.');
      return;
    }
    if (newPassword !== confirmPassword) { setError('The two passwords do not match.'); return; }
    try {
      setBusy(true);
      const data = await resetPassword(email.trim().toLowerCase(), code, newPassword);
      setStatus(data.message);
      setStep('done');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(getRequestError(requestError, 'Could not reset the password. Request a new code and try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={step === 'done' ? 'Password changed' : 'Reset your password'}
      description={step === 'request' ? 'Enter your account email. We will send a six-digit code so you can create a new password.' : step === 'reset' ? 'Enter the code from your email and choose a new password. The code expires after 10 minutes.' : 'Your old password and existing sign-in sessions are no longer valid.'}
      footer={<p>Remember your password? <Link to="/login">Sign in</Link></p>}
    >
      {error && <div className="auth-alert" role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
      {status && <div className="auth-notice" role="status">{status}</div>}

      {step === 'request' && <form className="auth-form verification-form" onSubmit={handleRequest}>
        <label className="form-field" htmlFor="reset-email"><span>Email address</span><input className="auth-input" id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
        <p className="form-security-note">If this email has a verified account, a code will arrive shortly.</p>
      </form>}

      {step === 'reset' && <form className="auth-form verification-form" onSubmit={handleReset}>
        <label className="form-field" htmlFor="reset-confirm-email"><span>Email address</span><input className="auth-input" id="reset-confirm-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="form-field" htmlFor="reset-code"><span>6-digit reset code</span><input className="auth-input verification-code-input" id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></label>
        <label className="form-field" htmlFor="reset-new-password"><span>New password</span><input className="auth-input" id="reset-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
        <label className="form-field" htmlFor="reset-confirm-password"><span>Confirm new password</span><input className="auth-input" id="reset-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
        <p className="form-security-note">Use 8–72 characters, including uppercase and lowercase letters and a number.</p>
        <button className="auth-submit" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Changing password…' : 'Change password'}</button>
        <button className="auth-secondary" type="button" onClick={handleRequest} disabled={busy || resendIn > 0}>{resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}</button>
      </form>}

      {step === 'done' && <p className="auth-help-link"><Link to="/login">Sign in with your new password</Link></p>}
    </AuthLayout>
  );
}
