import IncidentMap from './components/IncidentMap';
import PageHeader from './components/PageHeader';

export default function DispatchPage({ incidents }) {
  return (
    <>
      <PageHeader title="Dispatch map" description="Review the exact coordinates shared by citizens." />
      <section className="rescue-card"><IncidentMap incidents={incidents} tall /></section>
    </>
  );
}
