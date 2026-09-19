import { useEffect, useState } from 'react';
import { adminError, fetchAdminOverview } from '../../api/admin';
import AppIcon from '../../components/AppIcon';

const SERVICE_LABELS = {
  AMBULANCE: 'Ambulance', FIRE: 'Fire', POLICE: 'Police',
  SEARCH_RESCUE: 'Search & rescue', DISASTER: 'Disaster', OTHER: 'Other',
};

function when(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function OverviewPage({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchAdminOverview();
        if (active) { setData(result); setError(''); }
      } catch (err) {
        if (active) setError(adminError(err, 'Could not load command center data.'));
      }
    }
    load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const counts = data?.counts;
  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">System administration · Live operations</p>
          <h1 className="rescue-page-title">Command center</h1>
          <p className="rescue-page-lede">Welcome, {(user?.name || 'Administrator').split(' ')[0]}. Review incident activity and manage access to the rescue network.</p>
        </div>
        <button className="rescue-button rescue-button--primary" type="button" onClick={() => onNavigate('analytics')}>
          <AppIcon name="activity" size={17} /> View analytics
        </button>
      </div>

      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-grid rescue-grid--4" aria-label="System totals">
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="users" /></span></div><strong>{counts?.citizens ?? '—'}</strong><p>Citizens</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="shield" /></span></div><strong>{counts?.responders ?? '—'}</strong><p>Responders</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--danger"><AppIcon name="alert" /></span></div><strong>{counts?.activeIncidents ?? '—'}</strong><p>Active incidents</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--amber"><AppIcon name="clipboard" /></span></div><strong>{counts?.totalIncidents ?? '—'}</strong><p>Total incidents</p></article>
      </section>

      <section className="rescue-section operations-layout">
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Recent incidents</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('analytics')}>Explore trends</button></header>
          {data?.recentIncidents?.length ? (
            <ul className="rescue-list">
              {data.recentIncidents.map((incident) => (
                <li className="rescue-list__item" key={incident.id}>
                  <span className="rescue-list__icon"><AppIcon name="alert" /></span>
                  <span className="rescue-list__copy"><strong>{SERVICE_LABELS[incident.service]} · {incident.citizen.name}</strong><small>{incident.status.replace('_', ' ')} · {incident.assignedResponder?.name || 'Unassigned'}</small></span>
                  <span className="rescue-list__meta">{when(incident.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : <div className="rescue-card__body"><p className="rescue-empty-note">No incidents recorded yet.</p></div>}
        </article>
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Administration</h2></header>
          <div className="rescue-card__body admin-overview-links">
            <p><strong>{counts?.blockedUsers ?? '—'}</strong> blocked accounts</p>
            <p><strong>{counts?.admins ?? '—'}</strong> administrators</p>
            <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('users')}>Manage users</button>
          </div>
          <header className="rescue-card__header"><h2>Recent admin actions</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('audit')}>View all</button></header>
          {data?.recentAudit?.length ? (
            <ul className="rescue-list">
              {data.recentAudit.map((entry) => (
                <li className="rescue-list__item" key={entry.id}>
                  <span className="rescue-list__icon"><AppIcon name="activity" /></span>
                  <span className="rescue-list__copy"><strong>{entry.actor.name} {entry.action === 'USER_BLOCKED' ? 'blocked' : 'unblocked'} {entry.targetUser.name}</strong><small>{entry.reason || 'Account access restored'}</small></span>
                </li>
              ))}
            </ul>
          ) : <div className="rescue-card__body"><p className="rescue-empty-note">No admin actions recorded yet.</p></div>}
        </article>
      </section>
    </>
  );
}
