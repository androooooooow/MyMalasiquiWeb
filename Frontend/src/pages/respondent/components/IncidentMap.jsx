import { useState } from 'react';
import AppIcon from '../../../components/AppIcon';
import googleDirectionsUrl from './googleDirectionsUrl';

export default function IncidentMap({ incidents, tall = false }) {
  const incident = incidents[0];
  const [shownIncidentId, setShownIncidentId] = useState(null);
  const coordinatesReady = Number.isFinite(incident?.latitude) && Number.isFinite(incident?.longitude);
  const mapUrl = coordinatesReady && shownIncidentId === incident.id
    ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=16&output=embed`
    : null;
  return (
    <div className={`responder-google-map${tall ? ' responder-google-map--tall' : ''}`}>
      {incident ? (
        <>
          {mapUrl
            ? <iframe className="google-map-frame" title={`Google map showing ${incident.citizen.name}'s emergency location`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            : <div className="emergency-map-waiting"><AppIcon name="location" size={28} /><strong>{coordinatesReady ? 'Citizen location available' : 'Waiting for citizen GPS'}</strong>{coordinatesReady && <p>{incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}</p>}<p>Showing the map shares this citizen location with Google.</p>{coordinatesReady && <button className="rescue-button rescue-button--primary rescue-button--small" type="button" onClick={() => setShownIncidentId(incident.id)}>Show Google map</button>}</div>}
          <div className="responder-google-map__bar">
            <span>
              <strong>{incident.citizen.name}</strong>
              <small>{incident.landmark || incident.citizen.address || 'Citizen GPS location'}</small>
              <small>{incident.assignedResponder ? `Accepted by ${incident.assignedResponder.name}` : 'Awaiting acceptance'}</small>
            </span>
            <a
              className="rescue-button rescue-button--primary rescue-button--small"
              href={googleDirectionsUrl(incident)}
              target="_blank"
              rel="noreferrer"
            >
              <AppIcon name="map" size={14} /> Open driving route in Google Maps
            </a>
          </div>
        </>
      ) : (
        <div className="emergency-map-waiting">
          <AppIcon name="location" size={28} />
          <strong>Waiting for citizen locations</strong>
        </div>
      )}
    </div>
  );
}
