import { useEffect, useState } from 'react';
import { getRequestError, updateProfile } from '../api/auth';
import AppIcon from './AppIcon';

function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function accountTypeLabel(role) {
  if (!role) return 'Not available';
  return role === 'respondent' ? 'Responder' : role.charAt(0).toUpperCase() + role.slice(1);
}

export default function ProfileEditor({ user, onUserUpdated, description, unitLabel }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', phone_num: '', address: '' });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone_num: user?.phone_num || '',
      address: user?.address || '',
    });
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function cancelEditing() {
    setForm({ name: user?.name || '', phone_num: user?.phone_num || '', address: user?.address || '' });
    setError('');
    setIsEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const profile = {
      name: form.name.trim(),
      phone_num: form.phone_num.trim(),
      address: form.address.trim(),
    };
    if (Object.values(profile).some((value) => !value)) {
      setError('Please complete every profile field.');
      return;
    }

    try {
      setIsSaving(true);
      const data = await updateProfile(profile);
      onUserUpdated?.(data.user);
      setNotice(data.message || 'Profile updated successfully.');
      setIsEditing(false);
    } catch (requestError) {
      setError(getRequestError(requestError, 'Your profile could not be updated.'));
    } finally {
      setIsSaving(false);
    }
  }

  const details = [
    ['Full name', user?.name || 'Not provided'],
    ['Email address', user?.email || 'Not provided'],
    ['Phone number', user?.phone_num || 'Not provided'],
    ['Address', user?.address || 'Not provided'],
    ['Account type', accountTypeLabel(user?.role)],
    ...(unitLabel ? [['Response unit', unitLabel]] : []),
    ['Member since', formatDate(user?.created_at)],
  ];

  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Personal information</p>
          <h1 className="rescue-page-title">My profile</h1>
          <p className="rescue-page-lede">{description}</p>
        </div>
        {!isEditing && (
          <button className="rescue-button rescue-button--primary" type="button" onClick={() => { setNotice(''); setIsEditing(true); }}>
            <AppIcon name="settings" size={16} /> Edit profile
          </button>
        )}
      </div>

      {error && <div className="emergency-error" role="alert"><AppIcon name="alert" size={18} /> {error}</div>}
      {notice && <div className="profile-notice" role="status"><AppIcon name="shield" size={18} /> {notice}</div>}

      <div className="profile-layout">
        <aside className="rescue-card profile-summary">
          <span className="profile-summary__avatar">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
          <h2>{user?.name || 'Rescue App user'}</h2>
          <p>{user?.email}</p>
          <span className="rescue-status-pill">Email verified</span>
          {unitLabel && <p className="profile-summary__unit">{unitLabel}</p>}
        </aside>

        {isEditing ? (
          <form className="rescue-card profile-details" onSubmit={handleSubmit}>
            <header className="rescue-card__header"><h2>Edit contact details</h2><AppIcon name="settings" size={18} /></header>
            <div className="profile-edit-form">
              <label className="emergency-field">
                <span>Full name</span>
                <input name="name" type="text" autoComplete="name" minLength="2" maxLength="100" value={form.name} onChange={handleChange} required />
              </label>
              <label className="emergency-field">
                <span>Phone number</span>
                <input name="phone_num" type="tel" autoComplete="tel" inputMode="tel" value={form.phone_num} onChange={handleChange} required />
              </label>
              <label className="emergency-field emergency-field--wide">
                <span>Address</span>
                <textarea name="address" autoComplete="street-address" rows="3" minLength="5" maxLength="250" value={form.address} onChange={handleChange} required />
              </label>
              <div className="profile-protected-fields emergency-field--wide">
                <AppIcon name="shield" size={17} />
                <span>Email, account type, and responder unit cannot be changed from this form.</span>
              </div>
              <div className="profile-form-actions emergency-field--wide">
                <button className="rescue-button rescue-button--ghost" type="button" onClick={cancelEditing} disabled={isSaving}>Cancel</button>
                <button className="rescue-button rescue-button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </div>
          </form>
        ) : (
          <section className="rescue-card profile-details" aria-label="Account details">
            <header className="rescue-card__header"><h2>Account details</h2><AppIcon name="shield" size={18} /></header>
            <dl style={{ margin: 0 }}>
              {details.map(([label, value]) => (
                <div className="profile-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </>
  );
}
