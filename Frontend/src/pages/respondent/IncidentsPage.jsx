import AppIcon from '../../components/AppIcon';
import IncidentList from './components/IncidentList';
import PageHeader from './components/PageHeader';

export default function IncidentsPage({ incidents, loading, busyId, onAccept, onStatus, onRefresh, unitLabel, currentUserId }) {
  return (
    <>
      <PageHeader
        title="Incident queue"
        description="Accept incoming requests assigned to your unit and update your response status."
        action={(
          <button className="rescue-button rescue-button--ghost" type="button" onClick={onRefresh}>
            <AppIcon name="clock" size={15} /> Refresh queue
          </button>
        )}
      />
      <section className="rescue-card">
        <header className="rescue-card__header">
          <h2>{unitLabel} priority queue</h2>
          <span className="rescue-status-pill rescue-status-pill--danger">{incidents.length} active</span>
        </header>
        <IncidentList incidents={incidents} loading={loading} busyId={busyId} onAccept={onAccept} onStatus={onStatus} unitLabel={unitLabel} currentUserId={currentUserId} />
      </section>
    </>
  );
}
