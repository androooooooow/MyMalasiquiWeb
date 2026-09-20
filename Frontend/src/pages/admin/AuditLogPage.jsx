import { useEffect, useState } from 'react';
import { adminError, fetchAdminAuditLog } from '../../api/admin';
import { AUDIT_ACTIONS, auditActionLabel } from './auditLabels';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('all');
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminAuditLog({ page, role, action, search })
      .then((data) => { if (active) { setResult(data); setError(''); } })
      .catch((err) => { if (active) setError(adminError(err, 'Could not load audit log.')); });
    return () => { active = false; };
  }, [page, role, action, search]);

  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Accountability</p><h1 className="rescue-page-title">Audit log</h1><p className="rescue-page-lede">Successful sign-ins and important actions by citizens, responders, and administrators. New activity appears after refreshing this page.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-card">
        <div className="admin-filters">
          <label>Find person<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} maxLength={80} placeholder="Name or email" /></label>
          <label>Role<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="all">All roles</option><option value="citizen">Citizen</option><option value="respondent">Responder</option><option value="admin">Administrator</option></select></label>
          <label>Action<select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><option value="all">All actions</option>{Object.entries(AUDIT_ACTIONS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Person</th><th>Role</th><th>Action</th><th>Related to</th></tr></thead><tbody>{result?.entries?.map((entry) => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString()}</td><td><strong>{entry.actorName}</strong><small>{entry.actorEmail}</small></td><td>{entry.actorRole === 'respondent' ? 'Responder' : entry.actorRole === 'admin' ? 'Administrator' : 'Citizen'}</td><td>{auditActionLabel(entry.action)}</td><td>{entry.subjectType && <strong>{entry.subjectType} {entry.subjectId}</strong>}{entry.details && <small>{entry.details}</small>}{!entry.subjectType && !entry.details && '—'}</td></tr>)}</tbody></table>{result && result.entries.length === 0 && <p className="rescue-empty-note admin-empty">No matching activity yet.</p>}</div>
        <div className="admin-pagination"><span>{result?.total ?? 0} event(s) · Page {page}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={!result || page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>
    </>
  );
}
