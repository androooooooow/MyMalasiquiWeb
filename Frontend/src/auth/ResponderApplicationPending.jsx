import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function ResponderApplicationPending() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <AuthLayout
      eyebrow="Application received"
      title="Awaiting administrator approval"
      description="Your responder account has not been created yet. An administrator will review your application and selected response unit."
      footer={<p>Already approved? <Link to="/login">Sign in</Link></p>}
    >
      <div className="verification-card">
        <div className="auth-notice" role="status">
          {email ? `We’ll email ${email} after approval.` : 'We’ll email you after approval.'} The message will include a 6-digit code to verify your email and activate your account.
        </div>
        <p>If you receive the approval code, <Link to={`/check-email?email=${encodeURIComponent(email)}`}>enter it here</Link>. You cannot sign in as a responder before approval and email verification.</p>
      </div>
    </AuthLayout>
  );
}
