import { useState } from 'react';
import AppIcon from '../../components/AppIcon';

const COMPREHENSIVE_GUIDES = [
  {
    id: 'flood',
    tag: 'Flood & Water',
    time: '3 min read',
    title: 'Before and during floodwater rise in Malasiqui',
    summary: 'Essential procedures for households near low-lying barangays, rivers, and drainage channels.',
    steps: [
      { phase: 'Before floodwaters reach your street', action: 'Move valuable appliances, electronics, and vital documents (IDs, land titles, certificates) to upper floors or waterproof containers.' },
      { phase: 'Prepare utilities', action: 'Switch off main electrical breakers and LPG tank valves before floodwaters touch ground level to prevent electrocution and explosions.' },
      { phase: 'Evacuation readiness', action: 'Do not wait until water reaches waist-high. When MDRRMO or barangay officials announce pre-emptive evacuation, proceed immediately to the designated barangay evacuation center.' },
      { phase: 'Water safety rule', action: 'Never walk or drive through moving floodwaters. Just 15 cm (6 inches) of rapid water can sweep an adult off their feet; 30 cm can float a small vehicle.' },
    ],
    hotline: 'MDRRMO Rescue: (075) 536-1234 or 0928 123 4567',
  },
  {
    id: 'typhoon',
    tag: 'Typhoon & Storm',
    time: '4 min read',
    title: 'Severe typhoon readiness and high-wind protection',
    summary: 'Steps to secure your residence and maintain communications when severe weather hits Pangasinan.',
    steps: [
      { phase: 'Secure exterior items', action: 'Board up or tape large glass windows if shutters are absent. Tie down loose roofing sheets, galvanized iron, antenna masts, and outdoor furniture.' },
      { phase: 'Charge devices & battery banks', action: 'Fully charge all mobile phones, rechargeable lanterns, and portable radios. Conserve battery life by setting phones to low-power mode.' },
      { phase: 'Water & emergency provisions', action: 'Store at least 4 liters of clean drinking water per person per day for at least 72 hours. Fill clean containers for sanitation and dishwashing.' },
      { phase: 'During the storm peak', action: 'Stay in the strongest interior room away from windows and glass doors. Listen to local MDRRMO and provincial disaster broadcasts.' },
    ],
    hotline: 'MDRRMO & Municipal Hall: (075) 536-7890',
  },
  {
    id: 'earthquake',
    tag: 'Earthquake',
    time: '2 min read',
    title: 'Drop, Cover, and Hold On — Ground tremor safety',
    summary: 'Life-saving physical positions during sudden seismic tremors and immediate aftershock protocol.',
    steps: [
      { phase: 'Drop immediately', action: 'Drop down onto your hands and knees. This position protects you from being knocked over and allows you to stay low and crawl to shelter.' },
      { phase: 'Cover head and torso', action: 'Cover your head and neck under a sturdy desk or table. If no shelter is nearby, drop down near an interior wall and cover your head with your arms.' },
      { phase: 'Hold on', action: 'Hold on to your shelter until the shaking stops completely. Be prepared for your shelter to move with the shaking.' },
      { phase: 'After the tremor stops', action: 'Check yourself and others for injuries. Check for gas leaks or electrical fires. Evacuate outdoors to an open area away from power lines and brick walls.' },
    ],
    hotline: 'Emergency Dispatch: (075) 536-1234',
  },
  {
    id: 'fire',
    tag: 'Fire Safety',
    time: '3 min read',
    title: 'Residential fire evacuation & suppression rules',
    summary: 'Immediate responses to smoke, electrical sparks, and safe exit paths before BFP arrives.',
    steps: [
      { phase: 'Crawl low under smoke', action: 'Smoke and toxic gases rise to the ceiling. If smoke fills the room, drop to your hands and knees where air is cooler and cleaner.' },
      { phase: 'Feel doors before opening', action: 'Touch door handles and the door surface with the back of your hand. If it feels hot, do not open it — fire is on the other side; seek another exit.' },
      { phase: 'Never re-enter a burning structure', action: 'Once outside, stay outside. Immediately notify BFP Malasiqui with your exact barangay address, landmark, and whether anyone is trapped inside.' },
      { phase: 'Electrical fire precaution', action: 'Never pour water on an electrical fire. Use a Type ABC dry chemical fire extinguisher, or cut main power if safe to do so.' },
    ],
    hotline: 'BFP Malasiqui Fire Station: (075) 536-5678 or 0915 987 6543',
  },
  {
    id: 'firstaid',
    tag: 'First Aid',
    time: '4 min read',
    title: 'Basic trauma & bleeding control while waiting for ambulance',
    summary: 'Initial stabilization steps to save lives in severe injuries and medical distress.',
    steps: [
      { phase: 'Direct pressure for bleeding', action: 'Apply firm, continuous direct pressure onto the wound using a sterile dressing or cleanest available cloth. Do not remove soaked gauze; add more on top.' },
      { phase: 'Burn care', action: 'Cool heat burns immediately under clean, cool running water for 10 to 20 minutes. Do not apply ice, butter, or toothpaste to open burns.' },
      { phase: 'Choking intervention', action: 'If someone cannot cough or breathe, perform 5 firm back blows between the shoulder blades followed by 5 quick abdominal thrusts (Heimlich maneuver).' },
      { phase: 'Recovery position', action: 'For an unresponsive person who is breathing normally, place them onto their side in the recovery position to keep their airway open.' },
    ],
    hotline: 'RHU Ambulance Dispatch: (075) 536-3456 or 0945 112 2334',
  },
  {
    id: 'gobag',
    tag: 'Go-Bag',
    time: '5 min read',
    title: 'Assembling a 72-hour household disaster kit',
    summary: 'Checklist of indispensable items to have packed and accessible at a moment’s notice.',
    steps: [
      { phase: 'Water & food', action: 'Ready-to-eat canned goods (with manual can opener), energy bars, and at least 3 liters of potable drinking water per family member.' },
      { phase: 'Medical supplies', action: '7-day supply of personal prescription medicines, antiseptic solution, bandages, paracetamol, oral rehydration salts, and surgical masks.' },
      { phase: 'Light & power', action: 'High-lumen LED flashlight, spare batteries, solar/hand-crank powerbank, and heavy-duty emergency whistle for signaling search teams.' },
      { phase: 'Personal documents', action: 'Birth certificates, marriage contracts, property titles, insurance policies, and emergency cash stored inside a sealed waterproof pouch.' },
    ],
    hotline: 'MDRRMO Preparedness Desk: (075) 536-1234',
  },
];

export default function KnowledgePage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [activeGuide, setActiveGuide] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});

  const tags = ['All', 'Flood & Water', 'Typhoon & Storm', 'Earthquake', 'Fire Safety', 'First Aid', 'Go-Bag'];

  const filteredGuides = COMPREHENSIVE_GUIDES.filter((guide) => {
    const matchesTag = selectedTag === 'All' || guide.tag === selectedTag;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      guide.title.toLowerCase().includes(term) ||
      guide.summary.toLowerCase().includes(term) ||
      guide.steps.some((s) => s.action.toLowerCase().includes(term) || s.phase.toLowerCase().includes(term));
    return matchesTag && matchesSearch;
  });

  function toggleStep(guideId, stepIndex) {
    const key = `${guideId}-${stepIndex}`;
    setCheckedSteps((curr) => ({ ...curr, [key]: !curr[key] }));
  }

  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Community preparedness library</p>
          <h1 className="rescue-page-title">Safety guides & readiness</h1>
          <p className="rescue-page-lede">
            Step-by-step municipal guidelines designed to be understood and practiced before an emergency strikes in Malasiqui.
          </p>
        </div>
      </div>

      {/* Search and Tag Filters */}
      <div className="knowledge-controls">
        <div className="knowledge-search-wrap">
          <AppIcon name="search" size={17} />
          <input
            type="search"
            placeholder="Search guides by hazard, symptom, or safety action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="knowledge-search-input"
          />
          {search && (
            <button type="button" className="knowledge-search-clear" onClick={() => setSearch('')}>
              <AppIcon name="close" size={14} />
            </button>
          )}
        </div>

        <div className="knowledge-tags" role="group" aria-label="Hazard categories">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`knowledge-tag-btn${selectedTag === tag ? ' knowledge-tag-btn--active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Guides Grid */}
      <div className="knowledge-grid">
        {filteredGuides.map((guide) => (
          <article className="rescue-card knowledge-card" key={guide.id}>
            <div className="knowledge-card__accent" />
            <div className="knowledge-card__body">
              <div className="knowledge-card__meta">
                <span className="rescue-status-pill">{guide.tag}</span>
                <span>{guide.time}</span>
              </div>
              <h2 style={{ fontSize: '1.05rem', marginTop: '0.45rem' }}>{guide.title}</h2>
              <p>{guide.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button
                  className="rescue-button rescue-button--ghost rescue-button--small"
                  type="button"
                  onClick={() => setActiveGuide(guide)}
                >
                  Read full guide <AppIcon name="chevron" size={14} />
                </button>
                <small style={{ color: 'var(--ink-400, #8b9890)', fontSize: '0.74rem' }}>
                  {guide.steps.length} key steps
                </small>
              </div>
            </div>
          </article>
        ))}

        {!filteredGuides.length && (
          <div className="rescue-card" style={{ gridColumn: '1 / -1', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--ink-600, #65746a)' }}>
              No safety guides found matching &ldquo;{search}&rdquo;. Try another keyword or reset the filter.
            </p>
            <button
              className="rescue-button rescue-button--ghost rescue-button--small"
              type="button"
              style={{ marginTop: '0.85rem' }}
              onClick={() => { setSearch(''); setSelectedTag('All'); }}
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      {/* Interactive Guide Reader Modal */}
      {activeGuide && (
        <div
          className="guide-modal-backdrop"
          onClick={() => setActiveGuide(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="guide-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="guide-modal-head">
              <div>
                <span className="rescue-status-pill">{activeGuide.tag} · {activeGuide.time}</span>
                <h2 id="guide-modal-title" style={{ margin: '0.45rem 0 0.2rem', fontSize: '1.25rem' }}>
                  {activeGuide.title}
                </h2>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-600, #65746a)' }}>
                  {activeGuide.summary}
                </p>
              </div>
              <button
                className="guide-modal-close"
                type="button"
                onClick={() => setActiveGuide(null)}
                aria-label="Close guide"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            <div className="guide-modal-body">
              <h3 style={{ fontSize: '0.94rem', margin: '0 0 0.8rem', color: 'var(--ink-800, #1b2c25)' }}>
                Action Checklist — What to do step by step:
              </h3>

              <div className="guide-steps-list">
                {activeGuide.steps.map((step, idx) => {
                  const isChecked = Boolean(checkedSteps[`${activeGuide.id}-${idx}`]);
                  return (
                    <div
                      key={step.phase}
                      className={`guide-step-item${isChecked ? ' guide-step-item--done' : ''}`}
                      onClick={() => toggleStep(activeGuide.id, idx)}
                    >
                      <button
                        type="button"
                        className="guide-step-check"
                        aria-checked={isChecked}
                        role="checkbox"
                      >
                        {isChecked ? <AppIcon name="check" size={13} /> : idx + 1}
                      </button>
                      <div>
                        <strong>{step.phase}</strong>
                        <p>{step.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="guide-modal-hotline">
                <AppIcon name="phone" size={16} />
                <span>
                  <strong>Immediate Assistance Hotline:</strong> {activeGuide.hotline}
                </span>
              </div>
            </div>

            <div className="guide-modal-foot">
              <button
                className="rescue-button rescue-button--primary rescue-button--small"
                type="button"
                onClick={() => setActiveGuide(null)}
              >
                Got it, close guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
