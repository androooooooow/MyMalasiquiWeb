import { useEffect, useState } from 'react';
import { adminError, fetchAdminOverview } from '../../api/admin';
import AppIcon from '../../components/AppIcon';
import { auditActionLabel } from './auditLabels';

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
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const result = await fetchAdminOverview();
      setData(result);
      setError('');
    } catch (err) {
      if (!silent) setError(adminError(err, 'Could not load command center data.'));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    loadData();
    const timer = window.setInterval(() => {
      if (active) loadData(true);
    }, 15000);
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
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="rescue-button rescue-button--ghost"
            type="button"
            onClick={() => loadData()}
            disabled={refreshing}
            title="Refresh command center stats"
          >
            <AppIcon name="refresh" size={15} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="rescue-button rescue-button--primary" type="button" onClick={() => onNavigate('analytics')}>
            <AppIcon name="activity" size={17} /> View analytics
          </button>
        </div>
      </div>

      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-grid rescue-grid--4" aria-label="System totals">
        <article
          className="rescue-card rescue-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('users')}
          title="Click to manage citizens"
        >
          <div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="users" /></span><span className="rescue-stat__trend">Users</span></div>
          <strong>{counts?.citizens ?? '—'}</strong>
          <p>Citizens</p>
        </article>
        <article
          className="rescue-card rescue-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('applications')}
          title="Click to review responder applications"
        >
          <div className="rescue-stat__top">
            <span className="rescue-stat__icon"><AppIcon name="shield" /></span>
            {counts?.pendingResponderApplications > 0 && (
              <span className="rescue-status-pill rescue-status-pill--amber">{counts.pendingResponderApplications} pending</span>
            )}
          </div>
          <strong>{counts?.responders ?? '—'}</strong>
          <p>Responders</p>
        </article>
        <article
          className="rescue-card rescue-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('analytics')}
          title="Click to view active incidents in analytics"
        >
          <div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--danger"><AppIcon name="alert" /></span><span className="rescue-stat__trend">Live</span></div>
          <strong>{counts?.activeIncidents ?? '—'}</strong>
          <p>Active incidents</p>
        </article>
        <article
          className="rescue-card rescue-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('analytics')}
          title="Click to view total incident history"
        >
          <div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--amber"><AppIcon name="clipboard" /></span><span className="rescue-stat__trend">History</span></div>
          <strong>{counts?.totalIncidents ?? '—'}</strong>
          <p>Total incidents</p>
        </article>
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
            <p><strong>{counts?.pendingResponderApplications ?? '—'}</strong> responder applications waiting for approval</p>
            <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('users')}>Manage users</button>
            <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('applications')}>Review responders</button>
          </div>
          <header className="rescue-card__header"><h2>Recent activity</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('audit')}>View all</button></header>
          {data?.recentAudit?.length ? (
            <ul className="rescue-list">
              {data.recentAudit.map((entry) => (
                <li className="rescue-list__item" key={entry.id}>
                  <span className="rescue-list__icon"><AppIcon name="activity" /></span>
                  <span className="rescue-list__copy"><strong>{entry.actorName} · {auditActionLabel(entry.action)}</strong><small>{entry.actorRole}{entry.details ? ` · ${entry.details}` : ''}</small></span>
                </li>
              ))}
            </ul>
          ) : <div className="rescue-card__body"><p className="rescue-empty-note">No activity recorded yet.</p></div>}
        </article>
      </section>
    </>
  );
}
