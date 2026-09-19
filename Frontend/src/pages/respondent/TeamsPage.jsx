import AppIcon from '../../components/AppIcon';
import PageHeader from './components/PageHeader';
import { SERVICE_LABELS } from './constants';

export default function TeamsPage({ members, unitLabel }) {
  return (
    <>
      <PageHeader title="Response team" description={`Live assignments for ${unitLabel}. See exactly which responder accepted each emergency.`} />
      <section className="rescue-grid rescue-grid--3">
        {members.map((member) => {
          const assignments = member.assignedEmergencyRequests;
          return (
            <article className="rescue-card rescue-stat" key={member.id}>
              <div className="rescue-stat__top">
                <span className="rescue-stat__icon"><AppIcon name="users" /></span>
                <span className={`rescue-status-pill ${assignments.length ? 'rescue-status-pill--amber' : ''}`}>{assignments.length ? 'Responding' : 'No active assignment'}</span>
              </div>
              <strong className="responder-team-name">{member.name}</strong>
              <p>{assignments.length ? `${assignments.length} active emergency${assignments.length === 1 ? '' : ' requests'}` : 'No emergency accepted right now'}</p>
              {assignments.map((assignment) => (
                <p className="responder-team-assignment" key={assignment.id}>
                  <strong>{SERVICE_LABELS[assignment.service] || assignment.service}</strong>
                  <span>{assignment.citizen.name} · {assignment.status.replace('_', ' ')}</span>
                </p>
              ))}
            </article>
          );
        })}
      </section>
      {!members.length && <p className="rescue-empty-note">Loading your response unit members…</p>}
    </>
  );
}
