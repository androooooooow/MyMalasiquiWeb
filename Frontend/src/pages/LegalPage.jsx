import { Link } from 'react-router-dom';
import '../styles/legal.css';

const updated = '20 September 2026';
const operatorName = import.meta.env.VITE_OPERATOR_NAME?.trim();
const privacyEmail = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL?.trim();

function OperatorDetails() {
  return (
    <section className="legal-section">
      <h2>Operator and contact</h2>
      <p>App operator: {operatorName || 'Not yet specified'}</p>
      <p>Privacy contact: {privacyEmail ? <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> : 'Not yet specified'}</p>
    </section>
  );
}

export default function LegalPage({ type }) {
  const isPrivacy = type === 'privacy';
  return (
    <main className="legal-page">
      <div className="legal-wrap">
        <header className="legal-header">
          <Link className="legal-brand" to="/">RESCUE APP</Link>
          <Link className="legal-back" to="/">Back to app</Link>
        </header>
        <article className="legal-paper">
          <p className="legal-eyebrow">Malasiqui response network</p>
          <h1>{isPrivacy ? 'Privacy notice' : 'Terms of use'}</h1>
          <p className="legal-updated">Draft updated {updated}</p>
          <div className="legal-draft" role="note">
            Before public launch, the operator must confirm its identity, privacy contact, legal basis for processing, and retention schedule. This draft describes the current app, but is not a substitute for a reviewed policy.
          </div>

          {isPrivacy ? (
            <>
              <section className="legal-section">
                <h2>What we collect</h2>
                <p>Account registration records your name, address, phone number, email address, account role, and a password hash. Google sign-in also records a Google account identifier. Responder applications include the chosen response unit and the administrator’s approval decision.</p>
                <p>When you request rescue, the app records the service requested, your description, number of people affected, landmark, callback number, device-provided location and accuracy, and request status. A responder may share their location while responding. Messages, sign-in events, account changes, and operational audit entries are also stored.</p>
              </section>
              <section className="legal-section">
                <h2>Why and how the data is used</h2>
                <p>These details are used to verify accounts, route requests to the appropriate response unit, let responders locate and contact a citizen, coordinate through chat, manage responder access, and review system activity and incident totals.</p>
                <p>Location is requested for an emergency report and used for dispatch and mapping. The operator must identify and publish the applicable legal basis for each processing purpose before public use.</p>
              </section>
              <section className="legal-section">
                <h2>Who can see it</h2>
                <p>Authorized responders in the relevant unit can see requests routed to that unit and related conversations. The assigned responder can use the citizen’s location to navigate. Administrators can review account applications, users, incident summaries, and audit activity according to their role.</p>
                <p>Google sign-in, email delivery, mapping, and hosting providers process the information needed to provide those services. Opening an embedded Google Map may send map and location data to Google under its own terms and privacy practices.</p>
              </section>
              <section className="legal-section">
                <h2>Security and retention</h2>
                <p>The app uses password hashing, email verification, access controls, and rate limits. Contact details, incident text, and chat messages can be encrypted in storage when the operator configures the encryption key and completes the existing-data backfill. GPS coordinates are stored separately as numeric data for map and dispatch functions.</p>
                <p>No automatic deletion schedule is configured in the current system. Records remain until the operator removes them under a retention policy. The operator must publish that period and secure its database, backups, and service-provider access before launch.</p>
              </section>
              <section className="legal-section">
                <h2>Your choices and requests</h2>
                <p>You can review and correct your name, address, and phone number in your profile. You may ask the operator about access, correction, deletion, or other data-subject rights through the privacy contact below. Some records may need to be retained for incident handling or legal obligations, subject to the operator’s published policy.</p>
              </section>
              <OperatorDetails />
            </>
          ) : (
            <>
              <section className="legal-section">
                <h2>What the app does</h2>
                <p>RESCUE APP helps citizens send in-app emergency requests to the appropriate response unit and helps authorized responders coordinate a response. It is a coordination tool, not a guarantee that a responder will accept or arrive within a particular time.</p>
              </section>
              <section className="legal-section">
                <h2>Using your account</h2>
                <p>Provide accurate contact and location information, keep your sign-in details private, and report only genuine incidents. Responder accounts require administrator approval, email verification, and an assigned unit. Do not impersonate another person, misuse another account, or interfere with requests or messages.</p>
              </section>
              <section className="legal-section">
                <h2>Emergencies and availability</h2>
                <p>Check your request status in the app, but do not assume a request has been accepted until the app shows that status. If the app is unavailable or immediate help is needed, use an available official local emergency channel. Network, device, location, and service outages can affect the app.</p>
              </section>
              <section className="legal-section">
                <h2>Access and privacy</h2>
                <p>Administrators may restrict accounts used for abuse or unauthorized activity. Your information is handled as described in the <Link to="/privacy">Privacy notice</Link>. The operator should publish a contact for account or policy questions before public use.</p>
              </section>
              <OperatorDetails />
            </>
          )}
          <footer className="legal-footer">
            <Link to={isPrivacy ? '/terms' : '/privacy'}>{isPrivacy ? 'Read terms of use' : 'Read privacy notice'}</Link>
            <Link to="/">Return to app</Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
