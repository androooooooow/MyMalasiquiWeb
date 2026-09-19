import AppIcon from '../../../components/AppIcon';
import { SERVICE_LABELS } from '../constants';
import { timeLabel } from '../utils';
import googleDirectionsUrl from './googleDirectionsUrl';

export default function IncidentList({
  incidents,
  loading,
  busyId,
  onAccept,
  onStatus,
  currentUserId,
  unitLabel = 'your unit',
}) {
  if (loading) {
    return (
      <div className="rescue-card__body">
        <p className="rescue-empty-note">Loading live emergency requests…</p>
      </div>
    );
  }

  if (!incidents.length) {
    return (
      <div className="rescue-card__body">
        <p className="rescue-empty-note">
          No emergency requests for {unitLabel} are waiting. Your queue will update when a matching request arrives.
        </p>
      </div>
    );
  }

  return (
    <ul className="rescue-list responder-incidents">
      {incidents.map((incident) => (
        <li className="rescue-list__item responder-incident" key={incident.id}>
          <span className="rescue-list__icon"><AppIcon name="alert" /></span>
          <span className="rescue-list__copy">
            <strong>{SERVICE_LABELS[incident.service] || incident.service}</strong>
            <small>{incident.citizen.name} · {incident.landmark || incident.citizen.address || 'GPS location provided'}</small>
            <small className="responder-incident__description">{incident.description}</small>
            <small>{incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)} · ±{incident.accuracyMeters} m</small>
            {incident.assignedResponder && (
              <small className="responder-incident__assignee">
                <AppIcon name="user" size={13} /> Accepted by {incident.assignedResponder.name}
                {incident.assignedResponder.id === currentUserId ? ' (you)' : ''}
                {incident.status === 'EN_ROUTE' ? ' · On the way' : ''}
              </small>
            )}
            <a
              className="responder-map-link"
              href={googleDirectionsUrl(incident)}
              target="_blank"
              rel="noreferrer"
            >
              <AppIcon name="map" size={14} /> Open route in Google Maps
            </a>
          </span>
          <span className="responder-incident__actions">
            <span className={`rescue-status-pill ${incident.status === 'PENDING' ? 'rescue-status-pill--danger' : incident.status === 'ACCEPTED' ? 'rescue-status-pill--amber' : ''}`}>
              {incident.status.replace('_', ' ')}
            </span>
            <small className="rescue-list__meta">{timeLabel(incident.createdAt)}</small>
            {incident.status === 'PENDING' && (
              <button className="rescue-button rescue-button--danger rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onAccept(incident.id)}>
                {busyId === incident.id ? 'Accepting…' : 'Accept request'}
              </button>
            )}
            {incident.status === 'ACCEPTED' && incident.assignedResponder?.id === currentUserId && (
              <button className="rescue-button rescue-button--primary rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onStatus(incident.id, 'EN_ROUTE')}>
                Mark en route
              </button>
            )}
            {incident.status === 'EN_ROUTE' && incident.assignedResponder?.id === currentUserId && (
              <button className="rescue-button rescue-button--primary rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onStatus(incident.id, 'RESOLVED')}>
                Resolve
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
