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
          <p className="rescue-page-lede">Your safety tools, emergency requests, and community updates are ready in one place.</p>
        </div>
        <span className="rescue-status-pill">Account ready</span>
      </div>

      <div className="citizen-overview">
        <section className="rescue-card citizen-hero" aria-labelledby="citizen-safety-title">
          <span className="citizen-hero__badge"><AppIcon name="shield" size={14} /> RESCUE APP is standing by</span>
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
            <h2 id="readiness-title">Profile readiness</h2>
            <span className="rescue-status-pill rescue-status-pill--amber">Review</span>
          </div>
          <div className="citizen-readiness__score"><span>72%</span></div>
          <p>Complete your contact and address details so responders can identify you faster.</p>
          <div className="citizen-readiness__checks">
            <span className="citizen-readiness__check"><AppIcon name="check" size={15} /> Verified email</span>
            <span className="citizen-readiness__check"><AppIcon name="check" size={15} /> Contact information saved</span>
          </div>
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

      <section className="rescue-section rescue-grid rescue-grid--2">
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Community updates</h2><span className="rescue-status-pill">Live</span></header>
          <ul className="rescue-list">
            <li className="rescue-list__item">
              <span className="rescue-list__icon"><AppIcon name="activity" /></span>
              <span className="rescue-list__copy"><strong>No active municipal alert</strong><small>Local conditions are being monitored.</small></span>
              <span className="rescue-list__meta">Now</span>
            </li>
            <li className="rescue-list__item">
              <span className="rescue-list__icon"><AppIcon name="book" /></span>
              <span className="rescue-list__copy"><strong>Preparedness reminder</strong><small>Check your household go-bag this week.</small></span>
              <span className="rescue-list__meta">Today</span>
            </li>
          </ul>
        </article>
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Your location</h2><AppIcon name="location" size={18} /></header>
          <div className="rescue-card__body">
            <p className="rescue-empty-note"><strong>{user?.address || 'Address not yet provided'}</strong><br />Location sharing will be connected when the incident-reporting backend is built.</p>
          </div>
        </article>
      </section>
    </>
  );
}
