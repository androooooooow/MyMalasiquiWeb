import AppIcon from '../../components/AppIcon';
import PageHeader from './components/PageHeader';

const TEAMS = [
  { name: 'Alpha Medical', status: 'Available', members: 4, unit: 'R-01' },
  { name: 'Bravo Rescue', status: 'Deployed', members: 3, unit: 'R-02' },
  { name: 'Charlie Support', status: 'Available', members: 2, unit: 'R-03' },
];

export default function TeamsPage() {
  return (
    <>
      <PageHeader title="Response teams" description="Check readiness, assignments, and current availability." />
      <section className="rescue-grid rescue-grid--3">
        {TEAMS.map((team) => (
          <article className="rescue-card rescue-stat" key={team.name}>
            <div className="rescue-stat__top">
              <span className="rescue-stat__icon"><AppIcon name="users" /></span>
              <span className={`rescue-status-pill ${team.status === 'Deployed' ? 'rescue-status-pill--amber' : ''}`}>{team.status}</span>
            </div>
            <strong style={{ fontSize: '1rem' }}>{team.name}</strong>
            <p>{team.members} members · Unit {team.unit}</p>
          </article>
        ))}
      </section>
    </>
  );
}
