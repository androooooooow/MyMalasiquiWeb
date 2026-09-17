import AppIcon from '../../components/AppIcon';

const GUIDES = [
  { tag: 'Flood', time: '3 min read', title: 'Before floodwater rises', body: 'Move documents and essential items higher, charge your devices, and follow official evacuation guidance.' },
  { tag: 'Earthquake', time: '2 min read', title: 'Drop, cover, and hold on', body: 'Protect your head and neck beneath sturdy furniture, away from glass and unsecured shelves.' },
  { tag: 'Typhoon', time: '4 min read', title: 'Prepare for severe weather', body: 'Secure loose outdoor objects, store safe drinking water, and keep battery-powered lighting nearby.' },
  { tag: 'Household', time: '5 min read', title: 'Build a practical go-bag', body: 'Pack water, food, medicine, lighting, a whistle, hygiene items, and copies of key documents.' },
];

export default function KnowledgePage() {
  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Preparedness library</p>
          <h1 className="rescue-page-title">Know what to do next</h1>
          <p className="rescue-page-lede">Short, practical guides designed to be understood before an emergency happens.</p>
        </div>
        <button type="button" className="rescue-button rescue-button--ghost"><AppIcon name="search" size={16} /> Search guides</button>
      </div>

      <div className="knowledge-grid">
        {GUIDES.map((guide) => (
          <article className="rescue-card knowledge-card" key={guide.title}>
            <div className="knowledge-card__accent" />
            <div className="knowledge-card__body">
              <div className="knowledge-card__meta"><span className="rescue-status-pill">{guide.tag}</span><span>{guide.time}</span></div>
              <h2>{guide.title}</h2>
              <p>{guide.body}</p>
              <button className="rescue-button rescue-button--ghost rescue-button--small" type="button" style={{ marginTop: '0.9rem' }}>
                Read guide <AppIcon name="chevron" size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="rescue-empty-note rescue-section">These cards are the frontend design. Connect approved municipal safety content before enabling the full guide buttons.</p>
    </>
  );
}
