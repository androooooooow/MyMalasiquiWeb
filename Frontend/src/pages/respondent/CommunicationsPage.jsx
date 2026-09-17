import PageHeader from './components/PageHeader';

export default function CommunicationsPage() {
  return (
    <>
      <PageHeader title="Communications" description="Coordinate with citizens, dispatchers, and field teams." />
      <section className="rescue-card">
        <div className="rescue-card__body">
          <p className="rescue-empty-note">Incident-linked realtime messages will be added in the next backend phase.</p>
        </div>
      </section>
    </>
  );
}
