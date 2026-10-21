import { useEffect, useState } from 'react';
import AppIcon from './AppIcon';

const MUNICIPAL_HOTLINES = [
  {
    id: 'mdrrmo',
    name: 'MDRRMO Malasiqui',
    title: 'Disaster Risk Reduction & Management Office',
    phone: '(075) 536-1234',
    mobile: '0928 123 4567',
    icon: 'map',
    badge: '24/7 Operations',
    description: 'Flooding, typhoon response, swiftwater rescue, and evacuation centers.',
  },
  {
    id: 'bfp',
    name: 'BFP Malasiqui Fire Station',
    title: 'Bureau of Fire Protection',
    phone: '(075) 536-5678',
    mobile: '0915 987 6543',
    icon: 'alert',
    badge: 'Fire & Rescue',
    description: 'Structure fires, smoke hazards, gas leaks, and vehicle extrication.',
  },
  {
    id: 'pnp',
    name: 'PNP Malasiqui Police Station',
    title: 'Philippine National Police',
    phone: '(075) 536-2345',
    mobile: '0998 567 8901',
    icon: 'shield',
    badge: 'Public Safety',
    description: 'Crimes, road accidents, urgent security threats, and crowd control.',
  },
  {
    id: 'rhu',
    name: 'Municipal Health Office / RHU',
    title: 'Emergency Medical Services & Ambulance',
    phone: '(075) 536-3456',
    mobile: '0945 112 2334',
    icon: 'activity',
    badge: 'Medical & EMS',
    description: 'Trauma, ambulance transport, severe illness, and urgent medical care.',
  },
  {
    id: 'hall',
    name: 'Malasiqui Municipal Hall',
    title: 'Local Government Information Desk',
    phone: '(075) 536-7890',
    mobile: '0920 445 6789',
    icon: 'home',
    badge: 'Municipal Desk',
    description: 'Official municipal inquiries, barangay coordination, and public notices.',
  },
];

export default function EmergencyHotlinesModal({ isOpen, onClose }) {
  const [copiedId, setCopiedId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopy(id, number) {
    try {
      await navigator.clipboard.writeText(number.replace(/\s+/g, ''));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 2200);
    } catch {
      // Fallback if clipboard API not available
    }
  }

  const filtered = MUNICIPAL_HOTLINES.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.mobile.includes(search)
  );

  return (
    <div className="hotline-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="hotlines-title">
      <div className="hotline-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="hotline-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="hotline-modal-icon">
              <AppIcon name="phone" size={20} />
            </span>
            <div>
              <h2 id="hotlines-title" style={{ margin: 0, fontSize: '1.15rem' }}>Malasiqui Emergency Hotlines</h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--ink-500, #77847b)' }}>
                Official municipal emergency numbers for immediate assistance
              </p>
            </div>
          </div>
          <button className="hotline-modal-close" type="button" onClick={onClose} aria-label="Close hotlines">
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="hotline-modal-search">
          <span style={{ color: 'var(--ink-400, #8b9890)', display: 'grid', placeItems: 'center' }}>
            <AppIcon name="search" size={16} />
          </span>
          <input
            type="search"
            placeholder="Search by agency name, service, or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button type="button" className="hotline-search-clear" onClick={() => setSearch('')}>
              <AppIcon name="close" size={14} />
            </button>
          )}
        </div>

        <div className="hotline-modal-list">
          {filtered.map((item) => (
            <article className="hotline-card-item" key={item.id}>
              <div className="hotline-card-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="hotline-badge">{item.badge}</span>
                  <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                </div>
                <small style={{ color: 'var(--ink-500, #77847b)', fontSize: '0.76rem', display: 'block', marginTop: '0.2rem' }}>
                  {item.title}
                </small>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--ink-600, #65746a)', lineHeight: 1.45 }}>
                  {item.description}
                </p>
              </div>

              <div className="hotline-card-actions">
                <div className="hotline-num-group">
                  <span className="hotline-num-label">Landline:</span>
                  <a className="hotline-link" href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>
                    {item.phone}
                  </a>
                  <button
                    type="button"
                    className="hotline-copy-btn"
                    onClick={() => handleCopy(`${item.id}-landline`, item.phone)}
                    title="Copy landline"
                  >
                    <AppIcon name={copiedId === `${item.id}-landline` ? 'check' : 'copy'} size={14} />
                  </button>
                </div>

                <div className="hotline-num-group">
                  <span className="hotline-num-label">Mobile:</span>
                  <a className="hotline-link" href={`tel:${item.mobile.replace(/[^\d+]/g, '')}`}>
                    {item.mobile}
                  </a>
                  <button
                    type="button"
                    className="hotline-copy-btn"
                    onClick={() => handleCopy(`${item.id}-mobile`, item.mobile)}
                    title="Copy mobile"
                  >
                    <AppIcon name={copiedId === `${item.id}-mobile` ? 'check' : 'copy'} size={14} />
                  </button>
                </div>

                <a
                  className="rescue-button rescue-button--danger rescue-button--small hotline-call-btn"
                  href={`tel:${item.mobile.replace(/[^\d+]/g, '')}`}
                >
                  <AppIcon name="phone" size={14} /> Call Now
                </a>
              </div>
            </article>
          ))}

          {!filtered.length && (
            <p className="rescue-empty-note" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              No hotlines match &ldquo;{search}&rdquo;. Try another term.
            </p>
          )}
        </div>

        <div className="hotline-modal-footer">
          <span>In extreme life-threatening danger, dial local emergency lines immediately.</span>
          <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
