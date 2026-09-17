import { useCallback, useEffect, useState } from 'react';
import DashboardShell from '../components/DashboardShell';
import AppIcon from '../components/AppIcon';
import { acceptEmergencyRequest, fetchResponderQueue, getEmergencyError, updateEmergencyStatus, updateResponderLocation } from '../api/emergencies';

const NAV_ITEMS = [
  { key: 'overview', label: 'Operations', icon: 'home' },
  { key: 'incidents', label: 'Incidents', icon: 'alert' },
  { key: 'dispatch', label: 'Dispatch map', icon: 'map' },
  { key: 'teams', label: 'Response teams', icon: 'users' },
  { key: 'messages', label: 'Communications', icon: 'chat' },
];

const SERVICE_LABELS = {
  AMBULANCE: 'Ambulance / medical', FIRE: 'Fire rescue', POLICE: 'Police assistance',
  SEARCH_RESCUE: 'Search & rescue', DISASTER: 'Disaster response', OTHER: 'Other emergency',
};

function timeLabel(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.floor(hours / 24)} day ago`;
}

function IncidentList({ incidents, loading, busyId, onAccept, onStatus }) {
  if (loading) return <div className="rescue-card__body"><p className="rescue-empty-note">Loading live emergency requests…</p></div>;
  if (!incidents.length) return <div className="rescue-card__body"><p className="rescue-empty-note">No emergency requests are waiting. The queue will update when a citizen sends one.</p></div>;
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
            <a className="responder-map-link" href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer"><AppIcon name="map" size={14} /> Open route in Google Maps</a>
          </span>
          <span className="responder-incident__actions">
            <span className={`rescue-status-pill ${incident.status === 'PENDING' ? 'rescue-status-pill--danger' : incident.status === 'ACCEPTED' ? 'rescue-status-pill--amber' : ''}`}>{incident.status.replace('_', ' ')}</span>
            <small className="rescue-list__meta">{timeLabel(incident.createdAt)}</small>
            {incident.status === 'PENDING' && <button className="rescue-button rescue-button--danger rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onAccept(incident.id)}>{busyId === incident.id ? 'Accepting…' : 'Accept request'}</button>}
            {incident.status === 'ACCEPTED' && <button className="rescue-button rescue-button--primary rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onStatus(incident.id, 'EN_ROUTE')}>Mark en route</button>}
            {incident.status === 'EN_ROUTE' && <button className="rescue-button rescue-button--primary rescue-button--small" type="button" disabled={busyId === incident.id} onClick={() => onStatus(incident.id, 'RESOLVED')}>Resolve</button>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function IncidentMap({ incidents, tall = false }) {
  const incident = incidents[0];
  const mapUrl = incident ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=16&output=embed` : null;
  return (
    <div className={`responder-google-map${tall ? ' responder-google-map--tall' : ''}`}>
      {mapUrl ? <><iframe className="google-map-frame" title={`Citizen location for ${incident.citizen.name}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div className="responder-google-map__bar"><span><strong>{incident.citizen.name}</strong><small>{incident.landmark || incident.citizen.address || 'Citizen GPS location'}</small></span><a className="rescue-button rescue-button--primary rescue-button--small" href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer"><AppIcon name="map" size={14} /> Navigate</a></div></> : <div className="emergency-map-waiting"><AppIcon name="location" size={28} /><strong>Waiting for citizen locations</strong></div>}
    </div>
  );
}

function Overview({ user, incidents, loading, busyId, onNavigate, onAccept, onStatus }) {
  const assigned = incidents.filter((incident) => incident.assignedResponder?.id === user.id).length;
  const pending = incidents.filter((incident) => incident.status === 'PENDING').length;
  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Live operations</p><h1 className="rescue-page-title">Ready for dispatch, {(user?.name || 'Responder').split(' ')[0]}.</h1><p className="rescue-page-lede">Incoming citizen emergencies appear here with their requested service and precise location.</p></div><button className="rescue-button rescue-button--primary" type="button" onClick={() => onNavigate('incidents')}><AppIcon name="clipboard" size={17} /> Review queue</button></div>
      <section className="rescue-grid rescue-grid--4">
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--danger"><AppIcon name="alert" /></span><span className="rescue-stat__trend">Needs action</span></div><strong>{pending}</strong><p>Waiting requests</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="clipboard" /></span><span className="rescue-stat__trend">Your queue</span></div><strong>{assigned}</strong><p>Assigned incidents</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--amber"><AppIcon name="clock" /></span><span className="rescue-stat__trend">Live</span></div><strong>{incidents.length}</strong><p>Active incidents</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="location" /></span><span className="rescue-stat__trend">GPS enabled</span></div><strong>Live</strong><p>Citizen locations</p></article>
      </section>
      <section className="rescue-section operations-layout">
        <article className="rescue-card"><header className="rescue-card__header"><h2>Active incident map</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => onNavigate('dispatch')}>Open map</button></header><IncidentMap incidents={incidents} /></article>
        <article className="rescue-card"><header className="rescue-card__header"><h2>Incident queue</h2><span className="rescue-status-pill rescue-status-pill--danger">{incidents.length} active</span></header><IncidentList incidents={incidents} loading={loading} busyId={busyId} onAccept={onAccept} onStatus={onStatus} /></article>
      </section>
    </>
  );
}

function WorkspacePage({ page, incidents, loading, busyId, onAccept, onStatus, onRefresh }) {
  const headings = {
    incidents: ['Incident queue', 'Accept incoming requests and update your response status.'],
    dispatch: ['Dispatch map', 'Review the exact coordinates shared by citizens.'],
    teams: ['Response teams', 'Check readiness, assignments, and current availability.'],
    messages: ['Communications', 'Coordinate with citizens, dispatchers, and field teams.'],
  };
  const [title, lede] = headings[page];
  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Response workspace</p><h1 className="rescue-page-title">{title}</h1><p className="rescue-page-lede">{lede}</p></div>{page === 'incidents' && <button className="rescue-button rescue-button--ghost" type="button" onClick={onRefresh}><AppIcon name="clock" size={15} /> Refresh queue</button>}</div>
      {page === 'incidents' ? <section className="rescue-card"><header className="rescue-card__header"><h2>Priority queue</h2><span className="rescue-status-pill rescue-status-pill--danger">{incidents.length} active</span></header><IncidentList incidents={incidents} loading={loading} busyId={busyId} onAccept={onAccept} onStatus={onStatus} /></section>
        : page === 'dispatch' ? <section className="rescue-card"><IncidentMap incidents={incidents} tall /></section>
          : page === 'teams' ? <section className="rescue-grid rescue-grid--3">{['Alpha Medical', 'Bravo Rescue', 'Charlie Support'].map((team, index) => <article className="rescue-card rescue-stat" key={team}><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="users" /></span><span className={`rescue-status-pill ${index === 1 ? 'rescue-status-pill--amber' : ''}`}>{index === 1 ? 'Deployed' : 'Available'}</span></div><strong style={{ fontSize: '1rem' }}>{team}</strong><p>{4 - index} members · Unit R-0{index + 1}</p></article>)}</section>
            : <section className="rescue-card"><div className="rescue-card__body"><p className="rescue-empty-note">Incident-linked realtime messages will be added in the next backend phase.</p></div></section>}
    </>
  );
}

export default function RespondentDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('overview');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true); setError('');
    try { setIncidents(await fetchResponderQueue()); }
    catch (requestError) { setError(getEmergencyError(requestError, 'The responder queue could not be loaded.')); }
    finally { if (!silent) setLoading(false); }
  }, []);
  useEffect(() => {
    loadQueue();
    const interval = window.setInterval(() => loadQueue({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    const travelling = incidents.filter((incident) => incident.status === 'EN_ROUTE' && incident.assignedResponder?.id === user.id);
    if (!travelling.length || !navigator.geolocation) return undefined;
    let lastSentAt = 0;
    const watchId = navigator.geolocation.watchPosition(async (position) => {
      if (Date.now() - lastSentAt < 8000) return;
      lastSentAt = Date.now();
      const location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: Math.round(position.coords.accuracy) };
      const updates = await Promise.allSettled(travelling.map((incident) => updateResponderLocation(incident.id, location)));
      setIncidents((current) => current.map((incident) => {
        const index = travelling.findIndex((item) => item.id === incident.id);
        return index >= 0 && updates[index].status === 'fulfilled' ? updates[index].value : incident;
      }));
    }, () => setError('Live GPS sharing stopped. Allow location access so the citizen can track your response.'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [incidents, user.id]);

  async function acceptIncident(id) {
    setBusyId(id); setError('');
    try { const updated = await acceptEmergencyRequest(id); setIncidents((current) => current.map((item) => item.id === id ? updated : item)); }
    catch (requestError) { setError(getEmergencyError(requestError, 'This request could not be accepted.')); await loadQueue(); }
    finally { setBusyId(''); }
  }
  async function changeStatus(id, status) {
    setBusyId(id); setError('');
    try {
      if (status === 'EN_ROUTE') {
        if (!navigator.geolocation) throw new Error('Location sharing is not supported by this browser.');
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
        await updateResponderLocation(id, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: Math.round(position.coords.accuracy) });
      }
      const updated = await updateEmergencyStatus(id, status);
      setIncidents((current) => status === 'RESOLVED' ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? updated : item));
    }
    catch (requestError) { setError(getEmergencyError(requestError, 'The emergency status could not be updated.')); }
    finally { setBusyId(''); }
  }

  const pageProps = { incidents, loading, busyId, onAccept: acceptIncident, onStatus: changeStatus };
  const navItems = NAV_ITEMS.map((item) => item.key === 'incidents' ? { ...item, badge: incidents.length ? String(incidents.length) : undefined } : item);
  return (
    <DashboardShell user={user} roleLabel="Emergency responder" navItems={navItems} activePage={activePage} onNavigate={setActivePage} onLogout={onLogout}>
      {error && <div className="emergency-error" role="alert"><AppIcon name="alert" size={18} /> {error}</div>}
      {activePage === 'overview' ? <Overview user={user} {...pageProps} onNavigate={setActivePage} /> : <WorkspacePage page={activePage} {...pageProps} onRefresh={loadQueue} />}
    </DashboardShell>
  );
}
