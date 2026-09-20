import { useEffect, useState } from 'react';
import { adminError, fetchAdminAuditLog } from '../../api/admin';
import { AUDIT_ACTIONS, auditActionLabel } from './auditLabels';
import AdminPagination from './AdminPagination';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('all');
  const [action, setAction] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchDraft.trim() === search) return undefined;
    const timer = setTimeout(() => { setSearch(searchDraft.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setResult(null);
    if (searchDraft.trim() !== search) return () => { active = false; };
    fetchAdminAuditLog({ page, role, action, search })
      .then((data) => { if (active) { setResult(data); setPage(data.page); setError(''); } })
      .catch((err) => { if (active) setError(adminError(err, 'Could not load audit log.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, role, action, search, searchDraft]);

  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Accountability</p><h1 className="rescue-page-title">Audit log</h1><p className="rescue-page-lede">Successful sign-ins and important actions by citizens, responders, and administrators. New activity appears after refreshing this page.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-card">
        <div className="admin-filters">
          <label>Find person<input type="search" value={searchDraft} onChange={(event) => { setSearchDraft(event.target.value); setResult(null); }} maxLength={80} placeholder="Name or email" /></label>
          <label>Role<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); setResult(null); }}><option value="all">All roles</option><option value="citizen">Citizen</option><option value="respondent">Responder</option><option value="admin">Administrator</option></select></label>
          <label>Action<select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); setResult(null); }}><option value="all">All actions</option>{Object.entries(AUDIT_ACTIONS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        </div>
        <div className="admin-table-wrap" aria-busy={loading}><table className="admin-table"><thead><tr><th>When</th><th>Person</th><th>Role</th><th>Action</th><th>Related to</th></tr></thead><tbody>{result?.entries?.map((entry) => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString()}</td><td><strong>{entry.actorName}</strong><small>{entry.actorEmail}</small></td><td>{entry.actorRole === 'respondent' ? 'Responder' : entry.actorRole === 'admin' ? 'Administrator' : 'Citizen'}</td><td>{auditActionLabel(entry.action)}</td><td>{entry.subjectType && <strong>{entry.subjectType} {entry.subjectId}</strong>}{entry.details && <small>{entry.details}</small>}{!entry.subjectType && !entry.details && '—'}</td></tr>)}</tbody></table>{loading && <p className="rescue-empty-note admin-empty">Loading activity…</p>}{!loading && result?.entries.length === 0 && <p className="rescue-empty-note admin-empty">No matching activity yet.</p>}</div>
        <AdminPagination page={result?.page ?? page} pageSize={result?.pageSize ?? 10} total={result?.total ?? 0} loading={loading || !result || searchDraft.trim() !== search} itemLabel="events" onPageChange={(next) => { setPage(next); setResult(null); }} />
      </section>
    </>
  );
}
