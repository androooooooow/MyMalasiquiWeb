import AppIcon from '../../components/AppIcon';

const QUICK_ACTIONS = [
  { key: 'emergency', icon: 'alert', title: 'Request rescue', body: 'Send your emergency details and location.' },
  { key: 'knowledge', icon: 'book', title: 'Preparedness guides', body: 'Simple steps for common local hazards.' },
  { key: 'chats', icon: 'chat', title: 'Response messages', body: 'Follow updates from your rescue team.' },
];

export default function HomePage({ user, onNavigate }) {
  const firstName = (user?.name || user?.email || 'Neighbor').split(' ')[0];

  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Citizen command center</p>
          <h1 className="rescue-page-title">Good day, {firstName}.</h1>
          <p className="rescue-page-lede">Request help, follow your emergency, and keep your contact details up to date.</p>
        </div>

      </div>

      <div className="citizen-overview">
        <section className="rescue-card citizen-hero" aria-labelledby="citizen-safety-title">
          <span className="citizen-hero__badge"><AppIcon name="shield" size={14} /> Emergency support</span>
          <h1 id="citizen-safety-title">Help starts with the right information.</h1>
          <p>Use the emergency center to choose a rescue service, describe what happened, and share your exact location with responders.</p>
          <div className="citizen-hero__actions">
            <button className="rescue-button rescue-button--danger" type="button" onClick={() => onNavigate('emergency')}>
              <AppIcon name="alert" size={17} /> Request emergency help
            </button>
            <button className="rescue-button rescue-button--ghost" type="button" onClick={() => onNavigate('knowledge')}>View safety guides</button>
          </div>
        </section>

        <section className="rescue-card citizen-readiness" aria-labelledby="readiness-title">
          <div className="citizen-readiness__head">
            <h2 id="readiness-title">Your details</h2>
          </div>
          <p>Responders use these details to identify and contact you. Check them before you need help.</p>
          <dl className="citizen-details">
            <div><dt>Phone</dt><dd>{user?.phone_num || 'Not provided'}</dd></div>
            <div><dt>Address</dt><dd>{user?.address || 'Not provided'}</dd></div>
          </dl>
          <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('profile')}>Edit profile</button>
        </section>
      </div>

      <section className="rescue-section" aria-labelledby="quick-actions-title">
        <h2 className="rescue-section-title" id="quick-actions-title">Quick actions</h2>
        <div className="citizen-action-grid">
          {QUICK_ACTIONS.map((action) => (
            <button className="citizen-action" type="button" key={action.key} onClick={() => onNavigate(action.key)}>
              <span className="citizen-action__top">
                <span className="citizen-action__icon"><AppIcon name={action.icon} /></span>
                <AppIcon name="chevron" size={16} />
              </span>
              <strong>{action.title}</strong>
              <small>{action.body}</small>
            </button>
          ))}
        </div>
      </section>

      <p className="citizen-home-note">For an emergency request, you’ll choose the service you need and confirm your location before sending it.</p>
    </>
  );
}
