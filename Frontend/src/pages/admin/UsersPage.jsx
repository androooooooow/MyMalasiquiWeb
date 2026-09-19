import { useCallback, useEffect, useState } from 'react';
import { adminError, fetchAdminUsers, setUserBlocked } from '../../api/admin';

const UNIT_NAMES = {
  HEALTH_AMBULANCE: 'Health / Ambulance', PNP_POLICE: 'PNP / Police',
  BFP_FIRE: 'BFP / Fire', MDRRMO: 'MDRRMO',
};

export default function UsersPage({ currentUserId }) {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchDraft); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(async () => {
    const data = await fetchAdminUsers({ search, role, status, page });
    setResult(data);
    setError('');
  }, [search, role, status, page]);

  useEffect(() => {
    let active = true;
    fetchAdminUsers({ search, role, status, page })
      .then((data) => { if (active) { setResult(data); setError(''); } })
      .catch((err) => { if (active) setError(adminError(err, 'Could not load users.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, role, status, page]);

  async function saveAccess(event) {
    event.preventDefault();
    if (!target || busy) return;
    setBusy(true);
    setError('');
    try {
      await setUserBlocked(target.id, !target.blockedAt, reason.trim());
      setTarget(null);
      setReason('');
      await load();
    } catch (err) {
      setError(adminError(err, 'Could not change account access.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Administration</p><h1 className="rescue-page-title">User management</h1><p className="rescue-page-lede">Review citizen and responder accounts and control access to the system.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      <section className="rescue-card">
        <div className="admin-filters">
          <label>Search name or email<input type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search accounts" /></label>
          <label>Role<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="all">All roles</option><option value="citizen">Citizen</option><option value="respondent">Responder</option><option value="admin">Administrator</option></select></label>
          <label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="active">Not blocked</option><option value="blocked">Blocked</option></select></label>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>User</th><th>Role / unit</th><th>Email</th><th>Status</th><th>Access</th></tr></thead>
            <tbody>
              {result?.users?.map((account) => (
                <tr key={account.id}>
                  <td><strong>{account.name}</strong><small>Joined {new Date(account.createdAt).toLocaleDateString()}</small></td>
                  <td>{account.role === 'respondent' ? `Responder · ${UNIT_NAMES[account.responderUnit] || 'Unassigned'}` : account.role === 'admin' ? 'Administrator' : 'Citizen'}</td>
                  <td>{account.email}</td>
                  <td><span className={`admin-state${account.blockedAt ? ' admin-state--blocked' : ''}`}>{account.blockedAt ? 'Blocked' : account.emailVerifiedAt ? 'Active' : 'Unverified'}</span></td>
                  <td>{account.role === 'admin' || account.id === currentUserId ? 'Protected' : <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={() => { setTarget(account); setReason(''); }}>{account.blockedAt ? 'Unblock' : 'Block'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !result?.users?.length && <p className="rescue-empty-note admin-empty">No matching accounts.</p>}
          {loading && !result && <p className="rescue-empty-note admin-empty">Loading accounts…</p>}
        </div>
        <div className="admin-pagination"><span>{result?.total ?? 0} account(s) · Page {page}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={!result || page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>

      {target && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal rescue-card" role="dialog" aria-modal="true" aria-labelledby="access-title"><h2 id="access-title">{target.blockedAt ? 'Unblock' : 'Block'} {target.name}?</h2><p>{target.blockedAt ? 'This account will be able to sign in and use the app again.' : 'This takes effect immediately, including for an existing session.'}</p><form onSubmit={saveAccess}>{!target.blockedAt && <label>Reason for blocking<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={250} required placeholder="Explain why access is being blocked" /></label>}<div className="admin-modal-actions"><button className="rescue-button rescue-button--ghost" type="button" disabled={busy} onClick={() => setTarget(null)}>Cancel</button><button className="rescue-button rescue-button--primary" type="submit" disabled={busy || (!target.blockedAt && reason.trim().length < 5)}>{busy ? 'Saving…' : target.blockedAt ? 'Unblock account' : 'Block account'}</button></div></form></section></div>}
    </>
  );
}
