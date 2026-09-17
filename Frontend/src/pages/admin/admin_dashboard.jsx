import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import AppIcon from '../../components/AppIcon';

const NAV_ITEMS = [
  { key: 'overview', label: 'Command center', icon: 'home' },
  { key: 'users', label: 'User accounts', icon: 'users' },
  { key: 'responders', label: 'Responders', icon: 'shield' },
  { key: 'reports', label: 'Incident reports', icon: 'clipboard', badge: '3' },
  { key: 'settings', label: 'System settings', icon: 'settings' },
];

const RECENT_ACTIVITY = [
  ['New citizen account verified', '2 minutes ago'],
  ['Incident INC-1040 marked resolved', '18 minutes ago'],
  ['Responder Alpha team set available', '31 minutes ago'],
  ['Safety guide draft updated', '1 hour ago'],
];

function AdminOverview({ user }) {
  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">System administration</p>
          <h1 className="rescue-page-title">Command center</h1>
          <p className="rescue-page-lede">Welcome, {(user?.name || 'Administrator').split(' ')[0]}. Monitor RESCUE APP access, response readiness, and platform activity.</p>
        </div>
        <button className="rescue-button rescue-button--primary" type="button"><AppIcon name="plus" size={16} /> Add responder</button>
      </div>

      <section className="rescue-grid rescue-grid--4">
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="users" /></span><span className="rescue-stat__trend">+12 this month</span></div><strong>248</strong><p>Citizen accounts</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon"><AppIcon name="shield" /></span><span className="rescue-stat__trend">18 available</span></div><strong>31</strong><p>Registered responders</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--danger"><AppIcon name="alert" /></span><span className="rescue-stat__trend">Needs review</span></div><strong>3</strong><p>Open incidents</p></article>
        <article className="rescue-card rescue-stat"><div className="rescue-stat__top"><span className="rescue-stat__icon rescue-stat__icon--amber"><AppIcon name="activity" /></span><span className="rescue-status-pill">Healthy</span></div><strong>99.9%</strong><p>System availability</p></article>
      </section>

      <section className="rescue-section operations-layout">
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Recent platform activity</h2><button className="rescue-button rescue-button--ghost rescue-button--small" type="button">View audit log</button></header>
          <ul className="rescue-list">
            {RECENT_ACTIVITY.map(([activity, time]) => (
              <li className="rescue-list__item" key={activity}>
                <span className="rescue-list__icon"><AppIcon name="activity" /></span>
                <span className="rescue-list__copy"><strong>{activity}</strong><small>RESCUE APP activity preview</small></span>
                <span className="rescue-list__meta">{time}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rescue-card">
          <header className="rescue-card__header"><h2>Account distribution</h2></header>
          <div className="progress-row"><div className="progress-row__head"><strong>Citizens</strong><span>248</span></div><div className="progress-row__track"><div className="progress-row__fill" style={{ width: '82%' }} /></div></div>
          <div className="progress-row"><div className="progress-row__head"><strong>Responders</strong><span>31</span></div><div className="progress-row__track"><div className="progress-row__fill" style={{ width: '42%' }} /></div></div>
          <div className="progress-row"><div className="progress-row__head"><strong>Administrators</strong><span>4</span></div><div className="progress-row__track"><div className="progress-row__fill" style={{ width: '16%' }} /></div></div>
          <div className="rescue-card__body"><p className="rescue-empty-note">Values are frontend placeholders until administration APIs are connected.</p></div>
        </article>
      </section>
    </>
  );
}

function AdminSection({ page }) {
  const content = {
    users: ['User accounts', 'Search, review, and manage citizen access.', 'Account management table'],
    responders: ['Responders', 'Manage responder credentials, team assignment, and availability.', 'Responder management table'],
    reports: ['Incident reports', 'Review incident records and operational outcomes.', 'Incident reporting workspace'],
    settings: ['System settings', 'Configure alerts, contact information, roles, and service behavior.', 'Configuration panels'],
  };
  const [title, lede, placeholder] = content[page];
  return (
    <>
      <div className="rescue-page-head">
        <div><p className="rescue-eyebrow">Administration</p><h1 className="rescue-page-title">{title}</h1><p className="rescue-page-lede">{lede}</p></div>
        <button className="rescue-button rescue-button--primary" type="button"><AppIcon name="plus" size={16} /> Create new</button>
      </div>
      <section className="rescue-card">
        <header className="rescue-card__header"><h2>{placeholder}</h2><span className="rescue-status-pill rescue-status-pill--amber">Frontend preview</span></header>
        <div className="rescue-card__body"><p className="rescue-empty-note">This workspace is visually prepared. Search, filters, permissions, and persistent changes will be implemented with the corresponding backend APIs.</p></div>
      </section>
    </>
  );
}

export default function AdminDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('overview');
  return (
    <DashboardShell user={user} roleLabel="System administrator" navItems={NAV_ITEMS} activePage={activePage} onNavigate={setActivePage} onLogout={onLogout}>
      {activePage === 'overview' ? <AdminOverview user={user} /> : <AdminSection page={activePage} />}
    </DashboardShell>
  );
}
