import AppIcon from '../../../components/AppIcon';

export default function IncidentMap({ incidents, tall = false }) {
  const incident = incidents[0];
  const mapUrl = incident
    ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=16&output=embed`
    : null;

  return (
    <div className={`responder-google-map${tall ? ' responder-google-map--tall' : ''}`}>
      {mapUrl ? (
        <>
          <iframe
            className="google-map-frame"
            title={`Citizen location for ${incident.citizen.name}`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="responder-google-map__bar">
            <span>
              <strong>{incident.citizen.name}</strong>
              <small>{incident.landmark || incident.citizen.address || 'Citizen GPS location'}</small>
            </span>
            <a
              className="rescue-button rescue-button--primary rescue-button--small"
              href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              <AppIcon name="map" size={14} /> Navigate
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
