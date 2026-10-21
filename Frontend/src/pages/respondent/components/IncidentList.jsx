import { useState } from 'react';
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
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div className="rescue-card__body">
        <p className="rescue-empty-note">
          <span className="app-loading__spinner" style={{ width: '1.2rem', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Loading live emergency requests for {unitLabel}…
        </p>
      </div>
    );
  }

  if (!incidents.length) {
    return (
      <div className="rescue-card__body">
        <p className="rescue-empty-note">
          No emergency requests for {unitLabel} are waiting. Your queue updates automatically when a matching citizen request arrives.
        </p>
      </div>
    );
  }

  const pendingCount = incidents.filter((i) => i.status === 'PENDING').length;
  const myCount = incidents.filter((i) => i.assignedResponder?.id === currentUserId).length;
  const enRouteCount = incidents.filter((i) => i.status === 'EN_ROUTE').length;

  const filteredIncidents = incidents.filter((incident) => {
    let matchesStatus = true;
    if (filter === 'PENDING') matchesStatus = incident.status === 'PENDING';
    else if (filter === 'MY_ASSIGNED') matchesStatus = incident.assignedResponder?.id === currentUserId;
    else if (filter === 'EN_ROUTE') matchesStatus = incident.status === 'EN_ROUTE';

    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      incident.citizen?.name?.toLowerCase().includes(term) ||
      incident.description?.toLowerCase().includes(term) ||
      incident.landmark?.toLowerCase().includes(term) ||
      (SERVICE_LABELS[incident.service] || '').toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Interactive Incident Filters */}
      <div className="incident-filter-bar">
        <div className="incident-filter-pills" role="group" aria-label="Incident status filters">
          <button
            type="button"
            className={`incident-pill-btn${filter === 'ALL' ? ' incident-pill-btn--active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All ({incidents.length})
          </button>
          <button
            type="button"
            className={`incident-pill-btn${filter === 'PENDING' ? ' incident-pill-btn--active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            {pendingCount > 0 && <span className="incident-pulse-dot" aria-hidden="true" />}
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`incident-pill-btn${filter === 'MY_ASSIGNED' ? ' incident-pill-btn--active' : ''}`}
            onClick={() => setFilter('MY_ASSIGNED')}
          >
            My Assigned ({myCount})
          </button>
          <button
            type="button"
            className={`incident-pill-btn${filter === 'EN_ROUTE' ? ' incident-pill-btn--active' : ''}`}
            onClick={() => setFilter('EN_ROUTE')}
          >
            En Route ({enRouteCount})
          </button>
        </div>

        <div className="incident-search-wrap">
          <AppIcon name="search" size={15} />
          <input
            type="search"
            placeholder="Search incident list…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="incident-search-clear" onClick={() => setSearch('')}>
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>
      </div>

      <ul className="rescue-list responder-incidents">
        {filteredIncidents.map((incident) => {
          const citizenPhone = incident.callbackPhone || incident.citizen?.phone_num;
          return (
            <li className="rescue-list__item responder-incident" key={incident.id}>
              <span className={`rescue-list__icon${incident.status === 'PENDING' ? ' rescue-list__icon--danger' : ''}`}>
                <AppIcon name="alert" />
              </span>

              <span className="rescue-list__copy">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.94rem' }}>
                    {SERVICE_LABELS[incident.service] || incident.service}
                  </strong>
                  <span className={`rescue-status-pill ${incident.status === 'PENDING' ? 'rescue-status-pill--danger' : incident.status === 'ACCEPTED' ? 'rescue-status-pill--amber' : ''}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                </div>

                <small style={{ fontWeight: 600, color: 'var(--ink-700, #35453d)' }}>
                  Citizen: {incident.citizen.name}
                  {citizenPhone && (
                    <a
                      href={`tel:${citizenPhone.replace(/[^\d+]/g, '')}`}
                      style={{ marginLeft: '0.5rem', color: 'var(--teal-600, #245b51)', textDecoration: 'none' }}
                      title="Direct call citizen"
                    >
                      <AppIcon name="phone" size={13} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                      {citizenPhone}
                    </a>
                  )}
                </small>

                {incident.landmark && (
                  <small style={{ color: 'var(--ink-600, #65746a)' }}>
                    <strong>Landmark:</strong> {incident.landmark}
                  </small>
                )}

                <small className="responder-incident__description">
                  &ldquo;{incident.description}&rdquo;
                </small>

                <small style={{ color: 'var(--ink-500, #77847b)' }}>
                  GPS: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)} · Accuracy: ±{incident.accuracyMeters} m
                </small>

                {incident.assignedResponder && (
                  <small className="responder-incident__assignee">
                    <AppIcon name="user" size={13} />
                    Accepted by {incident.assignedResponder.name}
                    {incident.assignedResponder.id === currentUserId ? ' (You)' : ''}
                    {incident.status === 'EN_ROUTE' ? ' · En Route to Scene' : ''}
                  </small>
                )}

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <a
                    className="responder-map-link"
                    href={googleDirectionsUrl(incident)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <AppIcon name="map" size={14} /> Navigate with Google Maps
                  </a>
                </div>
              </span>

              <span className="responder-incident__actions">
                <small className="rescue-list__meta">{timeLabel(incident.createdAt)}</small>
                {incident.status === 'PENDING' && (
                  <button
                    className="rescue-button rescue-button--danger rescue-button--small"
                    type="button"
                    disabled={busyId === incident.id}
                    onClick={() => onAccept(incident.id)}
                  >
                    {busyId === incident.id ? 'Accepting…' : 'Accept request'}
                  </button>
                )}
                {incident.status === 'ACCEPTED' && incident.assignedResponder?.id === currentUserId && (
                  <button
                    className="rescue-button rescue-button--primary rescue-button--small"
                    type="button"
                    disabled={busyId === incident.id}
                    onClick={() => onStatus(incident.id, 'EN_ROUTE')}
                  >
                    Mark en route
                  </button>
                )}
                {incident.status === 'EN_ROUTE' && incident.assignedResponder?.id === currentUserId && (
                  <button
                    className="rescue-button rescue-button--primary rescue-button--small"
                    type="button"
                    disabled={busyId === incident.id}
                    onClick={() => onStatus(incident.id, 'RESOLVED')}
                  >
                    Resolve incident
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {!filteredIncidents.length && (
        <div className="rescue-card__body">
          <p className="rescue-empty-note">
            No incidents found matching &ldquo;{search}&rdquo; in this filter view.
          </p>
        </div>
      )}
    </div>
  );
}
