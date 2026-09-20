import { useEffect, useState } from 'react';
import {
  adminError, approveResponderApplication, fetchResponderApplications,
  rejectResponderApplication, resendResponderApprovalEmail,
} from '../../api/admin';

const UNIT_NAMES = {
  HEALTH_AMBULANCE: 'Health / Ambulance',
  PNP_POLICE: 'PNP / Police',
  BFP_FIRE: 'BFP / Fire',
  MDRRMO: 'MDRRMO',
};

export default function ResponderApplicationsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    fetchResponderApplications({ status, page })
      .then((data) => { if (active) { setResult(data); setError(''); } })
      .catch((requestError) => { if (active) setError(adminError(requestError, 'Could not load responder applications.')); });
    return () => { active = false; };
  }, [status, page, reload]);

  async function handleDecision(event) {
    event.preventDefault();
    if (!target || busyId) return;
    setBusyId(target.application.id);
    setError('');
    setNotice('');
    try {
      const response = target.action === 'approve'
        ? await approveResponderApplication(target.application.id)
        : await rejectResponderApplication(target.application.id, reason.trim());
      setNotice(response.message);
      setTarget(null);
      setReason('');
      setReload((count) => count + 1);
    } catch (requestError) {
      setError(adminError(requestError, 'Could not review the application.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResend(application) {
    if (busyId) return;
    setBusyId(application.id);
    setError('');
    setNotice('');
    try {
      const response = await resendResponderApprovalEmail(application.id);
      setNotice(response.message);
      setReload((count) => count + 1);
    } catch (requestError) {
      setError(adminError(requestError, 'Could not resend the approval email.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="rescue-page-head"><div><p className="rescue-eyebrow">Administration</p><h1 className="rescue-page-title">Responder approvals</h1><p className="rescue-page-lede">Review applications before any responder account is created. An approved applicant must still verify their email before signing in.</p></div></div>
      {error && <p className="emergency-error" role="alert">{error}</p>}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <section className="rescue-card">
        <div className="admin-filters"><label>Review status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setResult(null); }}><option value="PENDING">Pending review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></label></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Applicant</th><th>Response unit</th><th>Contact / address</th><th>Status</th><th>Action</th></tr></thead><tbody>{result?.applications?.map((application) => (
          <tr key={application.id}>
            <td><strong>{application.name}</strong><small>Applied {new Date(application.createdAt).toLocaleString()}</small></td>
            <td>{UNIT_NAMES[application.responderUnit] || application.responderUnit}</td>
            <td><strong>{application.email}</strong><small>{application.phoneNum} · {application.address}</small></td>
            <td><span className={`admin-state${application.status === 'PENDING' ? ' admin-state--pending' : application.status === 'REJECTED' ? ' admin-state--blocked' : ''}`}>{application.status === 'APPROVED' ? application.accountVerifiedAt ? 'Email verified' : application.emailSentAt ? 'Awaiting email verification' : 'Approval email not sent' : application.status === 'REJECTED' ? 'Rejected' : 'Pending'}</span>{application.reviewReason && <small>{application.reviewReason}</small>}{application.reviewedBy && <small>Reviewed by {application.reviewedBy.name}</small>}</td>
            <td>{application.status === 'PENDING' ? <div className="admin-application-actions"><button className="rescue-button rescue-button--primary rescue-button--small" type="button" disabled={Boolean(busyId)} onClick={() => setTarget({ application, action: 'approve' })}>Approve</button><button className="rescue-button rescue-button--ghost rescue-button--small" type="button" disabled={Boolean(busyId)} onClick={() => { setTarget({ application, action: 'reject' }); setReason(''); }}>Reject</button></div> : application.status === 'APPROVED' && !application.accountVerifiedAt ? <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" disabled={Boolean(busyId)} onClick={() => handleResend(application)}>{busyId === application.id ? 'Sending…' : 'Resend approval email'}</button> : '—'}</td>
          </tr>
        ))}</tbody></table>{result && result.applications.length === 0 && <p className="rescue-empty-note admin-empty">No {status.toLowerCase()} responder applications.</p>}</div>
        <div className="admin-pagination"><span>{result?.total ?? 0} application(s) · Page {page}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={!result || page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>
      {target && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal rescue-card" role="dialog" aria-modal="true" aria-labelledby="application-review-title"><h2 id="application-review-title">{target.action === 'approve' ? 'Approve' : 'Reject'} {target.application.name}?</h2><p>{target.action === 'approve' ? 'This will create a responder account for the selected unit and email a verification code. The applicant cannot sign in until they verify their email.' : 'The application will be closed. No responder account will be created, and the applicant may apply again.'}</p><form onSubmit={handleDecision}>{target.action === 'reject' && <label>Reason for rejection<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={250} required placeholder="Explain why the application was rejected" /></label>}<div className="admin-modal-actions"><button className="rescue-button rescue-button--ghost" type="button" disabled={Boolean(busyId)} onClick={() => setTarget(null)}>Cancel</button><button className="rescue-button rescue-button--primary" type="submit" disabled={Boolean(busyId) || (target.action === 'reject' && reason.trim().length < 5)}>{busyId ? 'Saving…' : target.action === 'approve' ? 'Approve responder' : 'Reject application'}</button></div></form></section></div>}
    </>
  );
}
