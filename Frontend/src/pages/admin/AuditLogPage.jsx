import { useEffect, useState } from 'react';
import { adminError, fetchAdminAuditLog } from '../../api/admin';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminAuditLog(page)
      .then((data) => { if (active) { setResult(data); setError(''); } })
      .catch((err) => { if (active) setError(adminError(err, 'Could not load audit log.')); });
    return () => { active = false; };
  }, [page]);

  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Accountability</p><h1 className="rescue-page-title">Audit log</h1><p className="rescue-page-lede">A permanent record of administrator account-access changes.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>User</th><th>Reason</th></tr></thead><tbody>{result?.entries?.map((entry) => <tr key={entry.id}><td>{new Date(entry.createdAt).toLocaleString()}</td><td><strong>{entry.actor.name}</strong><small>{entry.actor.email}</small></td><td>{entry.action === 'USER_BLOCKED' ? 'Blocked' : 'Unblocked'}</td><td><strong>{entry.targetUser.name}</strong><small>{entry.targetUser.email}</small></td><td>{entry.reason || '—'}</td></tr>)}</tbody></table>{result && result.entries.length === 0 && <p className="rescue-empty-note admin-empty">No administrator actions recorded yet.</p>}</div><div className="admin-pagination"><span>{result?.total ?? 0} action(s) · Page {page}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={!result || page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Next</button></div></div></section>
    </>
  );
}
