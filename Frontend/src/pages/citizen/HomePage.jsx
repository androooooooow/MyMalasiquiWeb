import { useEffect, useState } from 'react';
import AppIcon from '../../components/AppIcon';
import { fetchActiveEmergencyRequest } from '../../api/emergencies';
import EmergencyHotlinesModal from '../../components/EmergencyHotlinesModal';

const QUICK_ACTIONS = [
  { key: 'emergency', icon: 'alert', title: 'Request rescue', body: 'Send your emergency details and location.' },
  { key: 'knowledge', icon: 'book', title: 'Preparedness guides', body: 'Interactive guides and emergency Go-Bag list.' },
  { key: 'chats', icon: 'chat', title: 'Response messages', body: 'Follow live messages with your rescue team.' },
  { key: 'profile', icon: 'user', title: 'Contact & address', body: 'Keep your callback phone and barangay address updated.' },
];

export default function HomePage({ user, onNavigate }) {
  const firstName = (user?.name || user?.email || 'Neighbor').split(' ')[0];
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [gpsTest, setGpsTest] = useState({ state: 'idle', message: '', accuracy: null });
  const [showHotlinesModal, setShowHotlinesModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchActiveEmergencyRequest()
      .then((data) => {
        if (mounted) setActiveEmergency(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  function handleTestGps() {
    if (!navigator.geolocation) {
      setGpsTest({ state: 'error', message: 'Geolocation is not supported by your browser.', accuracy: null });
      return;
    }
    setGpsTest({ state: 'loading', message: 'Testing GPS sensor…', accuracy: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = Math.round(pos.coords.accuracy);
        setGpsTest({
          state: 'success',
          message: `GPS sensor locked! Accurate to ±${acc}m (${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°).`,
          accuracy: acc,
        });
      },
      (err) => {
        const errorMsg = err.code === 1
          ? 'Location permission denied. Please allow location in your browser settings.'
          : 'Could not obtain GPS fix. Try moving closer to an open window or outdoors.';
        setGpsTest({ state: 'error', message: errorMsg, accuracy: null });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Calculate profile completeness
  const checks = [
    Boolean(user?.name?.trim()),
    Boolean(user?.phone_num?.trim()),
    Boolean(user?.address?.trim()),
  ];
  const completedChecks = checks.filter(Boolean).length;
  const profileScore = Math.round((completedChecks / 3) * 100);

  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Citizen command center</p>
          <h1 className="rescue-page-title">Good day, {firstName}.</h1>
          <p className="rescue-page-lede">
            Request immediate emergency help, follow live responder updates, and keep your contact details verified.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="rescue-button rescue-button--danger"
            type="button"
            onClick={() => onNavigate('emergency')}
          >
            <AppIcon name="alert" size={17} /> Request rescue
          </button>
          <button
            className="rescue-button rescue-button--ghost"
            type="button"
            onClick={() => setShowHotlinesModal(true)}
          >
            <AppIcon name="phone" size={16} /> Directory
          </button>
        </div>
      </div>

      {/* Active Incident Live Banner */}
      {activeEmergency && (
        <section className="active-emergency-banner" aria-live="polite">
          <div className="active-emergency-banner__main">
            <span className="active-emergency-banner__pulse" aria-hidden="true" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="rescue-status-pill rescue-status-pill--danger">
                  {activeEmergency.status.replace('_', ' ')}
                </span>
                <strong style={{ fontSize: '0.96rem' }}>
                  Active Request: {activeEmergency.service?.replace('_', ' ')}
                </strong>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                {activeEmergency.assignedResponder
                  ? `Responder assigned: ${activeEmergency.assignedResponder.name} is handling your report.`
                  : 'Your request is in the active responder queue. Stay calm while a team is assigned.'}
              </p>
            </div>
          </div>
          <button
            className="rescue-button rescue-button--primary rescue-button--small"
            type="button"
            onClick={() => onNavigate('emergency')}
          >
            Track live dispatch <AppIcon name="chevron" size={15} />
          </button>
        </section>
      )}

      <div className="citizen-overview">
        <section className="rescue-card citizen-hero" aria-labelledby="citizen-safety-title">
          <span className="citizen-hero__badge">
            <AppIcon name="shield" size={14} /> Emergency coordination network
          </span>
          <h1 id="citizen-safety-title">Help starts with the right information.</h1>
          <p>
            Use the emergency center to choose a rescue service, describe what happened, and share your exact GPS coordinates with responders in Malasiqui.
          </p>
          <div className="citizen-hero__actions">
            <button
              className="rescue-button rescue-button--danger"
              type="button"
              onClick={() => onNavigate('emergency')}
            >
              <AppIcon name="alert" size={17} /> Request emergency help
            </button>
            <button
              className="rescue-button rescue-button--ghost"
              type="button"
              onClick={() => onNavigate('knowledge')}
            >
              <AppIcon name="book" size={16} /> View safety guides
            </button>
          </div>
        </section>

        {/* Readiness and GPS Sensor Test Card */}
        <section className="rescue-card citizen-readiness" aria-labelledby="readiness-title">
          <div className="citizen-readiness__head">
            <h2 id="readiness-title">Emergency profile readiness</h2>
            <span className="rescue-status-pill" style={{ background: profileScore === 100 ? 'var(--teal-100, #e9f1ec)' : '#fef3e0', color: profileScore === 100 ? 'var(--teal-600, #245b51)' : '#b45309' }}>
              {profileScore}% Ready
            </span>
          </div>

          <div className="citizen-progress-track" aria-hidden="true">
            <div className="citizen-progress-bar" style={{ width: `${profileScore}%` }} />
          </div>

          <p style={{ margin: '0.65rem 0 0.85rem' }}>
            {profileScore === 100
              ? 'Your profile is complete! Responders have your callback number and home address.'
              : 'Add missing contact information so responders can reach you without delay.'}
          </p>

          <dl className="citizen-details">
            <div>
              <dt>Phone</dt>
              <dd>{user?.phone_num || <span style={{ color: '#b7463c' }}>Missing — Add phone</span>}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{user?.address || <span style={{ color: '#b7463c' }}>Missing — Add address</span>}</dd>
            </div>
          </dl>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <button
              className="rescue-button rescue-button--ghost rescue-button--small"
              type="button"
              onClick={() => onNavigate('profile')}
            >
              Edit profile
            </button>
            <button
              className="rescue-button rescue-button--ghost rescue-button--small"
              type="button"
              onClick={handleTestGps}
              disabled={gpsTest.state === 'loading'}
            >
              <AppIcon name="location" size={14} />
              {gpsTest.state === 'loading' ? 'Testing GPS…' : 'Test device GPS'}
            </button>
          </div>

          {gpsTest.message && (
            <div
              className={`gps-test-note gps-test-note--${gpsTest.state}`}
              style={{ marginTop: '0.75rem' }}
            >
              <AppIcon name={gpsTest.state === 'success' ? 'check' : 'alert'} size={14} />
              <span>{gpsTest.message}</span>
            </div>
          )}
        </section>
      </div>

      {/* Quick Dial Municipal Hotline Badges */}
      <section className="rescue-card hotline-strip-card" aria-labelledby="hotlines-strip-title">
        <div className="hotline-strip-head">
          <div>
            <h2 id="hotlines-strip-title" style={{ fontSize: '0.94rem', margin: 0 }}>
              Direct Municipal Emergency Hotlines
            </h2>
            <small style={{ color: 'var(--ink-500, #77847b)' }}>
              Call immediately if you cannot submit an in-app report
            </small>
          </div>
          <button
            className="rescue-button rescue-button--ghost rescue-button--small"
            type="button"
            onClick={() => setShowHotlinesModal(true)}
          >
            View directory
          </button>
        </div>

        <div className="hotline-strip-grid">
          <a className="hotline-chip" href="tel:0755361234">
            <span className="hotline-chip__icon" style={{ background: '#e9f1ec', color: '#245b51' }}>
              <AppIcon name="map" size={16} />
            </span>
            <span>
              <strong>MDRRMO Rescue</strong>
              <small>(075) 536-1234</small>
            </span>
          </a>

          <a className="hotline-chip" href="tel:0755365678">
            <span className="hotline-chip__icon" style={{ background: '#fdf3e3', color: '#c87d20' }}>
              <AppIcon name="alert" size={16} />
            </span>
            <span>
              <strong>BFP Fire Station</strong>
              <small>(075) 536-5678</small>
            </span>
          </a>

          <a className="hotline-chip" href="tel:0755362345">
            <span className="hotline-chip__icon" style={{ background: '#e6f0ec', color: '#245b51' }}>
              <AppIcon name="shield" size={16} />
            </span>
            <span>
              <strong>PNP Police Station</strong>
              <small>(075) 536-2345</small>
            </span>
          </a>

          <a className="hotline-chip" href="tel:0755363456">
            <span className="hotline-chip__icon" style={{ background: '#fbeae8', color: '#b7463c' }}>
              <AppIcon name="activity" size={16} />
            </span>
            <span>
              <strong>RHU Ambulance</strong>
              <small>(075) 536-3456</small>
            </span>
          </a>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="rescue-section" aria-labelledby="quick-actions-title">
        <h2 className="rescue-section-title" id="quick-actions-title">Quick actions</h2>
        <div className="citizen-action-grid">
          {QUICK_ACTIONS.map((action) => (
            <button
              className="citizen-action"
              type="button"
              key={action.key}
              onClick={() => onNavigate(action.key)}
            >
              <span className="citizen-action__top">
                <span className="citizen-action__icon">
                  <AppIcon name={action.icon} />
                </span>
                <AppIcon name="chevron" size={16} />
              </span>
              <strong>{action.title}</strong>
              <small>{action.body}</small>
            </button>
          ))}
        </div>
      </section>

      <p className="citizen-home-note">
        For an emergency request, you’ll choose the service you need and confirm your location before sending it.
      </p>

      <EmergencyHotlinesModal
        isOpen={showHotlinesModal}
        onClose={() => setShowHotlinesModal(false)}
      />
    </>
  );
}
