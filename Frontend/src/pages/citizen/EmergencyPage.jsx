import { useCallback, useEffect, useState } from 'react';
import AppIcon from '../../components/AppIcon';
import { createEmergencyRequest, fetchActiveEmergencyRequest, getEmergencyError } from '../../api/emergencies';

const SERVICES = [
  { id: 'ambulance', title: 'Ambulance', description: 'Medical emergency or serious injury', icon: 'activity', tone: 'medical' },
  { id: 'fire', title: 'Fire rescue', description: 'Fire, smoke, gas leak, or explosion', icon: 'alert', tone: 'fire' },
  { id: 'police', title: 'Police', description: 'Crime, violence, or immediate security threat', icon: 'shield', tone: 'police' },
  { id: 'rescue', title: 'Search & rescue', description: 'Trapped, missing, stranded, or evacuation help', icon: 'users', tone: 'rescue' },
  { id: 'disaster', title: 'Disaster response', description: 'Flood, landslide, storm, or earthquake', icon: 'map', tone: 'disaster' },
  { id: 'other', title: 'Other emergency', description: 'Urgent help that does not match the options above', icon: 'plus', tone: 'other' },
];

const INITIAL_FORM = {
  service: '',
  description: '',
  peopleAffected: '1',
  landmark: '',
  phone: '',
};

const STATUS_COPY = {
  PENDING: { title: 'Waiting for a responder', detail: 'Your request is visible in the responder queue.', tone: 'danger' },
  ACCEPTED: { title: 'A responder accepted your request', detail: 'The responder is preparing to travel to your location.', tone: 'amber' },
  EN_ROUTE: { title: 'Responder is on the way', detail: 'Live responder location is shown below when available.', tone: 'active' },
};

export default function EmergencyPage() {
  const [step, setStep] = useState('service');
  const [form, setForm] = useState(INITIAL_FORM);
  const [location, setLocation] = useState(null);
  const [locationState, setLocationState] = useState('idle');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmergency, setSubmittedEmergency] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [showGoogleMap, setShowGoogleMap] = useState(false);

  const selectedService = SERVICES.find((service) => service.id === form.service);

  const loadActiveRequest = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingActive(true);
    try {
      const emergency = await fetchActiveEmergencyRequest();
      setActiveEmergency(emergency);
      if (emergency) {
        setSubmittedEmergency(emergency);
        setStep('ready');
      } else {
        setStep((current) => current === 'ready' ? 'service' : current);
      }
    } catch (requestError) {
      if (!silent) setError(getEmergencyError(requestError, 'Your active request could not be loaded.'));
    } finally {
      if (!silent) setLoadingActive(false);
    }
  }, []);

  useEffect(() => {
    loadActiveRequest();
    const interval = window.setInterval(() => loadActiveRequest({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, [loadActiveRequest]);

  function selectService(service) {
    setForm((current) => ({ ...current, service }));
    setError('');
    setStep('details');
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function requestLocation() {
    setError('');
    if (!navigator.geolocation) {
      setLocationState('error');
      setError('Location is not supported by this browser. Enter a nearby landmark instead.');
      return;
    }

    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setLocationState('success');
      },
      (locationError) => {
        setLocationState('error');
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser and try again.',
          2: 'Your location is currently unavailable. Move near a window or enter a nearby landmark.',
          3: 'Finding your location took too long. Please try again.',
        };
        setError(messages[locationError.code] || 'We could not get your location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function continueToReview(event) {
    event.preventDefault();
    setError('');
    if (form.description.trim().length < 10) {
      setError('Briefly describe what happened using at least 10 characters.');
      return;
    }
    if (!location) {
      setError('Share your current location so responders know where to go.');
      return;
    }
    setStep('review');
  }

  async function submitRequest() {
    setSubmitting(true);
    setError('');
    try {
      const result = await createEmergencyRequest({
        service: {
          ambulance: 'AMBULANCE',
          fire: 'FIRE',
          police: 'POLICE',
          rescue: 'SEARCH_RESCUE',
          disaster: 'DISASTER',
          other: 'OTHER',
        }[form.service],
        description: form.description.trim(),
        peopleAffected: form.peopleAffected,
        landmark: form.landmark.trim(),
        callbackPhone: form.phone.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracy,
      });
      setSubmittedEmergency(result.emergency);
      setActiveEmergency(result.emergency);
      setStep('ready');
    } catch (submitError) {
      setError(getEmergencyError(submitError, 'Your emergency request could not be sent. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingActive) {
    return <section className="emergency-complete"><span className="app-loading__spinner" aria-hidden="true" /><h1 className="rescue-page-title">Checking your active request…</h1></section>;
  }

  if (step === 'ready') {
    const emergency = activeEmergency || submittedEmergency;
    const status = STATUS_COPY[emergency?.status] || STATUS_COPY.PENDING;
    const responderLocationReady = Number.isFinite(emergency?.responderLatitude) && Number.isFinite(emergency?.responderLongitude);
    const responderMapUrl = showGoogleMap && responderLocationReady
      ? `https://www.google.com/maps?q=${emergency.responderLatitude},${emergency.responderLongitude}&z=16&output=embed`
      : null;
    return (
      <section className="emergency-tracker">
        <div className="rescue-page-head"><div><p className="rescue-eyebrow">Active emergency request</p><h1 className="rescue-page-title">{status.title}</h1><p className="rescue-page-lede">{status.detail}</p></div><span className={`rescue-status-pill rescue-status-pill--${status.tone}`}>{emergency?.status?.replace('_', ' ')}</span></div>
        <div className="emergency-tracker__notice"><AppIcon name="alert" size={18} /><span><strong>You cannot create another request yet.</strong><small>A new request becomes available after this incident is resolved.</small></span></div>
        <div className="emergency-tracker__layout">
          <article className="rescue-card">
            <header className="rescue-card__header"><h2>Response progress</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => loadActiveRequest()}>Refresh status</button></header>
            <ol className="emergency-timeline">
              {[
                ['PENDING', 'Request received', 'Your incident is in the responder queue.'],
                ['ACCEPTED', 'Responder assigned', emergency?.assignedResponder ? `${emergency.assignedResponder.name} accepted your request.` : 'Waiting for a responder.'],
                ['EN_ROUTE', 'Responder en route', 'The responder is travelling to your GPS location.'],
              ].map(([key, label, detail]) => {
                const order = ['PENDING', 'ACCEPTED', 'EN_ROUTE'];
                const complete = order.indexOf(emergency?.status) >= order.indexOf(key);
                return <li className={complete ? 'emergency-timeline__item emergency-timeline__item--complete' : 'emergency-timeline__item'} key={key}><span><AppIcon name={complete ? 'check' : 'clock'} size={15} /></span><div><strong>{label}</strong><small>{detail}</small></div></li>;
              })}
            </ol>
            <div className="emergency-tracker__details"><p><strong>Requested by</strong><span>{emergency?.citizen?.name || 'Citizen'}</span></p><p><strong>Responder</strong><span>{emergency?.assignedResponder?.name || 'Not assigned yet'}</span></p><p><strong>Contact</strong><span>{emergency?.assignedResponder?.phoneNum || 'Available after assignment'}</span></p></div>
          </article>
          <article className="rescue-card emergency-tracker__map-card">
            <header className="rescue-card__header"><h2>Responder live location</h2><span className="rescue-status-pill">Auto-updates</span></header>
            {responderMapUrl
              ? <iframe className="google-map-frame" title={`Google map showing ${emergency.assignedResponder?.name || 'responder'} location`} src={responderMapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              : <div className="emergency-map-waiting"><AppIcon name="location" size={28} /><strong>{responderLocationReady ? 'Responder location is ready' : 'Waiting for responder GPS'}</strong><p>{responderLocationReady ? 'Showing this map shares the responder coordinates with Google.' : 'The map becomes available when the assigned responder shares a location.'}</p>{responderLocationReady && <button className="rescue-button rescue-button--primary rescue-button--small" type="button" onClick={() => setShowGoogleMap(true)}>Show Google map</button>}</div>}
            {emergency?.responderLocationUpdatedAt && <p className="emergency-map-updated">{emergency?.assignedResponder?.name || 'Responder'} · Last GPS update: {new Date(emergency.responderLocationUpdatedAt).toLocaleTimeString()}</p>}
          </article>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="rescue-page-head emergency-page-head">
        <div>
          <p className="rescue-eyebrow">In-app emergency request</p>
          <h1 className="rescue-page-title">{step === 'service' ? 'What help do you need?' : step === 'details' ? 'Tell responders what happened' : 'Review your request'}</h1>
          <p className="rescue-page-lede">Your request will be stored securely and shown immediately in the RESCUE APP responder queue.</p>
        </div>
        <span className="rescue-status-pill rescue-status-pill--danger">Emergency workflow</span>
      </div>

      <ol className="emergency-steps" aria-label="Emergency request progress">
        {[
          ['service', 'Choose service'],
          ['details', 'Details & location'],
          ['review', 'Review request'],
        ].map(([key, label], index) => {
          const order = ['service', 'details', 'review'];
          const isComplete = order.indexOf(step) > index;
          const isActive = step === key;
          return (
            <li className={`emergency-step${isActive ? ' emergency-step--active' : ''}${isComplete ? ' emergency-step--complete' : ''}`} key={key}>
              <span>{isComplete ? <AppIcon name="check" size={14} /> : index + 1}</span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>

      {error && <div className="emergency-error" role="alert"><AppIcon name="alert" size={18} /> {error}</div>}

      {step === 'service' && (
        <section aria-labelledby="service-title">
          <div className="emergency-section-title">
            <div><h2 id="service-title">Select the response you need</h2><p>Choose the closest match. Responders can reassign the request when necessary.</p></div>
          </div>
          <div className="emergency-service-grid">
            {SERVICES.map((service) => (
              <button className={`emergency-service emergency-service--${service.tone}`} type="button" key={service.id} onClick={() => selectService(service.id)}>
                <span className="emergency-service__icon"><AppIcon name={service.icon} size={23} /></span>
                <span className="emergency-service__copy"><strong>{service.title}</strong><small>{service.description}</small></span>
                <AppIcon name="chevron" size={17} />
              </button>
            ))}
          </div>
          <p className="emergency-safety-note"><AppIcon name="shield" size={16} /> Only create a request for a real emergency. False reports can delay help for someone in danger.</p>
        </section>
      )}

      {step === 'details' && (
        <form className="emergency-form-layout" onSubmit={continueToReview}>
          <section className="rescue-card emergency-form-card">
            <header className="rescue-card__header">
              <h2>Incident details</h2>
              <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => setStep('service')}>Change service</button>
            </header>
            <div className="rescue-card__body emergency-form-fields">
              <div className="emergency-selected-service">
                <span className={`emergency-service__icon emergency-service__icon--${selectedService?.tone}`}><AppIcon name={selectedService?.icon || 'alert'} /></span>
                <span><small>Requested response</small><strong>{selectedService?.title}</strong></span>
              </div>

              <label className="emergency-field emergency-field--wide">
                <span>What happened? <em>Required</em></span>
                <textarea name="description" rows="5" maxLength="600" value={form.description} onChange={updateField} placeholder="Describe the emergency, injuries, hazards, and anything responders should know…" required />
                <small>{form.description.length}/600 characters</small>
              </label>

              <label className="emergency-field">
                <span>People affected</span>
                <select name="peopleAffected" value={form.peopleAffected} onChange={updateField}>
                  <option value="1">1 person</option>
                  <option value="2-5">2–5 people</option>
                  <option value="6-10">6–10 people</option>
                  <option value="10+">More than 10</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label className="emergency-field">
                <span>Callback number</span>
                <input name="phone" type="tel" inputMode="tel" maxLength="20" value={form.phone} onChange={updateField} placeholder="09XX XXX XXXX" />
              </label>

              <label className="emergency-field emergency-field--wide">
                <span>Nearby landmark or address</span>
                <input name="landmark" type="text" maxLength="180" value={form.landmark} onChange={updateField} placeholder="Street, barangay, building, or visible landmark" />
              </label>
            </div>
          </section>

          <aside className="rescue-card emergency-location-card">
            <header className="rescue-card__header"><h2>Your live location</h2><AppIcon name="location" size={18} /></header>
            <div className="emergency-location-map">
              <span className={`emergency-location-pin${location ? ' emergency-location-pin--active' : ''}`}><AppIcon name="location" size={24} /></span>
              <span className="emergency-location-map__label">{location ? 'Location captured' : 'Waiting for location'}</span>
            </div>
            <div className="rescue-card__body">
              {location ? (
                <div className="emergency-location-result">
                  <span className="rescue-status-pill">Location ready</span>
                  <dl>
                    <div><dt>Latitude</dt><dd>{location.latitude.toFixed(6)}</dd></div>
                    <div><dt>Longitude</dt><dd>{location.longitude.toFixed(6)}</dd></div>
                    <div><dt>Accuracy</dt><dd>Within approximately {location.accuracy} m</dd></div>
                  </dl>
                  <button className="rescue-button rescue-button--ghost" type="button" onClick={requestLocation}>Refresh location</button>
                </div>
              ) : (
                <>
                  <p className="emergency-location-copy">Allow RESCUE APP to use your device location so the assigned responder receives precise coordinates.</p>
                  <button className="rescue-button rescue-button--primary" type="button" onClick={requestLocation} disabled={locationState === 'loading'}>
                    <AppIcon name="location" size={17} /> {locationState === 'loading' ? 'Finding your location…' : 'Use my current location'}
                  </button>
                </>
              )}
              <p className="emergency-privacy-note"><AppIcon name="shield" size={14} /> Your coordinates are sent only when you confirm the emergency request.</p>
            </div>
          </aside>

          <div className="emergency-form-actions">
            <button className="rescue-button rescue-button--ghost" type="button" onClick={() => setStep('service')}>Back</button>
            <button className="rescue-button rescue-button--danger" type="submit">Review emergency request <AppIcon name="chevron" size={15} /></button>
          </div>
        </form>
      )}

      {step === 'review' && (
        <section className="emergency-review-layout">
          <article className="rescue-card">
            <header className="rescue-card__header"><h2>Responder dispatch summary</h2><span className="rescue-status-pill rescue-status-pill--amber">Ready to send</span></header>
            <dl className="emergency-review-list">
              <div><dt>Response needed</dt><dd>{selectedService?.title}</dd></div>
              <div><dt>People affected</dt><dd>{form.peopleAffected}</dd></div>
              <div><dt>Emergency details</dt><dd>{form.description}</dd></div>
              <div><dt>Nearby landmark</dt><dd>{form.landmark || 'Not provided'}</dd></div>
              <div><dt>Callback number</dt><dd>{form.phone || 'Use account phone number'}</dd></div>
              <div><dt>GPS coordinates</dt><dd>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} · ±{location.accuracy} m</dd></div>
            </dl>
          </article>

          <aside className="rescue-card emergency-review-side">
            <span className="emergency-review-side__icon"><AppIcon name="shield" size={26} /></span>
            <h2>Ready for responder routing</h2>
            <p>Sending places this request in the live responder queue with your selected service, incident details, and exact location.</p>
            <button className="rescue-button rescue-button--danger" type="button" onClick={submitRequest} disabled={submitting}>{submitting ? 'Sending request…' : 'Send emergency request'}</button>
            <button className="rescue-button rescue-button--ghost" type="button" onClick={() => setStep('details')}>Edit details</button>
          </aside>
        </section>
      )}
    </>
  );
}
