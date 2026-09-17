import AppIcon from '../../components/AppIcon';

const FIELDS = [
  { key: 'name', label: 'Full name' },
  { key: 'email', label: 'Email address' },
  { key: 'phone_num', label: 'Phone number' },
  { key: 'address', label: 'Home address' },
  { key: 'role', label: 'Account type' },
  { key: 'created_at', label: 'Member since' },
];

function formatValue(key, value) {
  if (!value) return 'Not provided';
  if (key === 'created_at') {
    return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (key === 'role') return value.charAt(0).toUpperCase() + value.slice(1);
  return value;
}

export default function ProfilePage({ user }) {
  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Personal information</p>
          <h1 className="rescue-page-title">My profile</h1>
          <p className="rescue-page-lede">Accurate contact information helps responders identify and reach you during an incident.</p>
        </div>
        <button className="rescue-button rescue-button--primary" type="button"><AppIcon name="settings" size={16} /> Edit profile</button>
      </div>

      <div className="profile-layout">
        <aside className="rescue-card profile-summary">
          <span className="profile-summary__avatar">{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>
          <h2>{user?.name || 'Rescue App user'}</h2>
          <p>{user?.email}</p>
          <span className="rescue-status-pill">Email verified</span>
          <p className="rescue-empty-note" style={{ marginTop: '1rem', textAlign: 'left' }}>Profile editing is designed but will be connected in the next backend phase.</p>
        </aside>

        <section className="rescue-card profile-details" aria-label="Account details">
          <header className="rescue-card__header"><h2>Account details</h2><AppIcon name="shield" size={18} /></header>
          <dl style={{ margin: 0 }}>
            {FIELDS.map(({ key, label }) => (
              <div className="profile-row" key={key}>
                <dt>{label}</dt>
                <dd>{formatValue(key, user?.[key])}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
