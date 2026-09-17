import AppIcon from '../../components/AppIcon';
import IncidentList from './components/IncidentList';
import IncidentMap from './components/IncidentMap';
import PageHeader from './components/PageHeader';
import { RESPONDER_UNIT_LABELS } from './constants';

export default function OverviewPage({ user, incidents, loading, busyId, onNavigate, onAccept, onStatus }) {
  const assigned = incidents.filter((incident) => incident.assignedResponder?.id === user.id).length;
  const pending = incidents.filter((incident) => incident.status === 'PENDING').length;
  const unitLabel = RESPONDER_UNIT_LABELS[user.responder_unit] || 'your response unit';

  return (
    <>
      <PageHeader
        eyebrow={`${unitLabel} · Live operations`}
        title={`Ready for dispatch, ${(user?.name || 'Responder').split(' ')[0]}.`}
        description={`Only citizen emergencies routed to ${unitLabel} appear here, with their requested service and precise location.`}
        action={(
          <button className="rescue-button rescue-button--primary" type="button" onClick={() => onNavigate('incidents')}>
            <AppIcon name="clipboard" size={17} /> Review queue
          </button>
        )}
      />

      <section className="rescue-grid rescue-grid--4">
        <article className="rescue-card rescue-stat">
          <div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--danger"><AppIcon name="alert" /></span><span className="rescue-stat__trend">Needs action</span></div>
          <strong>{pending}</strong><p>Waiting requests</p>
        </article>
        <article className="rescue-card rescue-stat">
          <div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="clipboard" /></span><span className="rescue-stat__trend">Your queue</span></div>
          <strong>{assigned}</strong><p>Assigned incidents</p>
        </article>
        <article className="rescue-card rescue-stat">
          <div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--amber"><AppIcon name="clock" /></span><span className="rescue-stat__trend">Live</span></div>
          <strong>{incidents.length}</strong><p>Active incidents</p>
        </article>
        <article className="rescue-card rescue-stat">
          <div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="location" /></span><span className="rescue-stat__trend">GPS enabled</span></div>
          <strong>Live</strong><p>Citizen locations</p>
        </article>
      </section>

      <section className="rescue-section operations-layout">
        <article className="rescue-card">
          <header className="rescue-card__header">
            <h2>Active incident map</h2>
            <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('dispatch')}>Open map</button>
          </header>
          <IncidentMap incidents={incidents} />
        </article>
        <article className="rescue-card">
          <header className="rescue-card__header">
            <h2>Incident queue</h2>
            <span className="rescue-status-pill rescue-status-pill--danger">{incidents.length} active</span>
          </header>
          <IncidentList incidents={incidents} loading={loading} busyId={busyId} onAccept={onAccept} onStatus={onStatus} unitLabel={unitLabel} />
        </article>
      </section>
    </>
  );
}
