import { useState } from 'react';
import IncidentMap from './components/IncidentMap';
import PageHeader from './components/PageHeader';

export default function DispatchPage({ incidents }) {
  const [selectedId, setSelectedId] = useState('');
  const selectedIncident = incidents.find((incident) => incident.id === selectedId) || incidents[0];
  return (
    <>
      <PageHeader title="Dispatch map" description="Review citizen locations and see which responder accepted each request." />
      <section className="rescue-card">
        {!!incidents.length && <div className="rescue-card__body dispatch-selector">
          <label htmlFor="dispatch-incident">Emergency request</label>
          <select id="dispatch-incident" value={selectedIncident?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
            {incidents.map((incident) => <option key={incident.id} value={incident.id}>{incident.citizen.name} · {incident.service.replace('_', ' ')} · {incident.assignedResponder?.name || 'Waiting for responder'}</option>)}
          </select>
        </div>}
        <IncidentMap incidents={selectedIncident ? [selectedIncident] : []} tall />
      </section>
    </>
  );
}
