// pages/citizen/ProfilePage.jsx
const FIELDS = [
  { key: 'name', label: 'Full name' },
  { key: 'email', label: 'Email address' },
  { key: 'phone_num', label: 'Phone number' },
  { key: 'address', label: 'Address' },
  { key: 'role', label: 'Account type' },
  { key: 'created_at', label: 'Account joined' },
];

function formatValue(key, value) {
  if (!value) return '—';
  if (key === 'created_at') {
    return new Date(value).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return value;
}

export default function ProfilePage({ user }) {
  return (
    <section aria-labelledby="profile-title">
      <p className="dashboard-card__eyebrow">Your account</p>
      <h1 id="profile-title" className="citizen-page-title">Profile</h1>
      <p className="citizen-page-lede">
        These details help responders reach you quickly during an emergency. Contact your
        barangay office if anything below needs to be corrected.
      </p>

      <dl className="citizen-profile-list">
        {FIELDS.map(({ key, label }) => (
          <div className="citizen-profile-row" key={key}>
            <dt>{label}</dt>
            <dd>{formatValue(key, user?.[key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}