import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppIcon from '../components/AppIcon';
import '../styles/landing.css';

function RescueLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M32 5 53 13v16c0 13.8-8.7 25.5-21 30C19.7 54.5 11 42.8 11 29V13L32 5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M32 8.5 50 15v14c0 12-7.3 22.4-18 27-10.7-4.6-18-15-18-27V15l18-6.5Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path d="M27 20h10v7h7v10h-7v7H27v-7h-7V27h7v-7Z" fill="currentColor" />
    </svg>
  );
}

const SCENARIOS = [
  {
    id: 'medical',
    label: 'Ambulance',
    barangay: 'Brgy. Poblacion',
    unit: 'Health / Ambulance Unit',
    eta: 'ETA 4 mins',
    coords: { x: 26, y: 30 },
    title: 'Medical Emergency — Chest Pain & Breathing Difficulty',
    summary: 'GPS coordinates locked (±6m accuracy). Nearest RHU ambulance unit dispatched with live telemetry.',
    steps: [
      { stage: '1. GPS Pinned', detail: 'Near Municipal Plaza, Poblacion (±6m)' },
      { stage: '2. Unit Assigned', detail: 'Malasiqui RHU Medic Team #2' },
      { stage: '3. En Route', detail: '1.4 km away • Live chat active' },
    ],
  },
  {
    id: 'flood',
    label: 'Flood Rescue',
    barangay: 'Brgy. Cabueldatan',
    unit: 'MDRRMO Search & Rescue',
    eta: 'ETA 6 mins',
    coords: { x: 76, y: 28 },
    title: 'Rising Floodwater — Family of 4 Requesting Evacuation',
    summary: 'Water level reported at knee-deep near riverbank. MDRRMO rescue boat & high-clearance vehicle en route.',
    steps: [
      { stage: '1. Report Sent', detail: '4 people affected • Landmark: Barangay Hall' },
      { stage: '2. MDRRMO Alerted', detail: 'Swiftwater Rescue Squad Alpha' },
      { stage: '3. En Route', detail: 'Evacuation center route prepared' },
    ],
  },
  {
    id: 'fire',
    label: 'Fire Alert',
    barangay: 'Brgy. Lokeb Sur',
    unit: 'BFP / Fire Truck',
    eta: 'ETA 5 mins',
    coords: { x: 72, y: 74 },
    title: 'Residential Electrical Fire — Smoke Reported',
    summary: 'Immediate dispatch sent to Bureau of Fire Protection Malasiqui Station with hydrant and road clearance notes.',
    steps: [
      { stage: '1. Alert Verified', detail: ' Caller callback confirmed • 0917-XXX-XXXX' },
      { stage: '2. BFP Dispatched', detail: 'Engine 01 + Tanker Unit' },
      { stage: '3. En Route', detail: 'Sirens active • 2.1 km to scene' },
    ],
  },
  {
    id: 'police',
    label: 'PNP Assist',
    barangay: 'Brgy. Gomez',
    unit: 'PNP / Police Patrol',
    eta: 'ETA 3 mins',
    coords: { x: 24, y: 72 },
    title: 'Roadway Collision & Public Safety Assistance',
    summary: 'Patrol sector notified for immediate traffic control, scene security, and medical coordination.',
    steps: [
      { stage: '1. Pin Shared', detail: 'Provincial Road KM 184' },
      { stage: '2. Patrol Routed', detail: 'PNP Mobile Patrol Sector 1' },
      { stage: '3. On Approach', detail: '0.9 km away • Direct responder chat open' },
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    id: 'select',
    number: '01',
    title: 'Select the emergency service',
    description: 'Choose Ambulance, Fire Rescue, Police, Search & Rescue, or Disaster Response in one tap.',
    badge: 'Step 1 of 3 • Citizen App',
    heading: 'One-tap service triage routes your report immediately',
    detail: 'Instead of waiting on a busy voice line, your request is automatically categorized and routed directly to the right Malasiqui response unit queue.',
    rows: [
      { label: 'Selected Service', value: 'Ambulance / Medical Emergency' },
      { label: 'Target Queue', value: 'Malasiqui Health / Ambulance Unit' },
      { label: 'Priority Status', value: 'Immediate Triage (Real-Time)' },
    ],
  },
  {
    id: 'locate',
    number: '02',
    title: 'Share exact GPS + barangay landmark',
    description: 'Attach high-accuracy device coordinates alongside a familiar local landmark and headcount.',
    badge: 'Step 2 of 3 • Location Lock',
    heading: 'Pinpoint accuracy even in hard-to-describe areas',
    detail: 'Combines browser GPS coordinates (with meter-level accuracy radius) and your written landmark so responders know the exact gate, alley, or barangay road.',
    rows: [
      { label: 'GPS Lock', value: '15.9204° N, 120.4158° E (±7m)' },
      { label: 'Nearest Landmark', value: 'Across from Brgy. Poblacion Covered Court' },
      { label: 'People Affected', value: '2 Individuals • Callback Verified' },
    ],
  },
  {
    id: 'track',
    number: '03',
    title: 'Track live responder status & chat directly',
    description: 'Watch your request move from Pending to Accepted to En Route with two-way responder messaging.',
    badge: 'Step 3 of 3 • Live Coordination',
    heading: 'Real-time status updates and two-way responder chat',
    detail: 'Know the moment a responder accepts your call, view their live map location while en route, and send critical updates through encrypted in-app messaging.',
    rows: [
      { label: 'Live Status', value: 'EN ROUTE — Responder is on the way' },
      { label: 'Assigned Team', value: 'MDRRMO / Medical Quick Response' },
      { label: 'In-App Chat', value: '"Keep the front gate unlocked, arriving in 3 mins."' },
    ],
  },
];

const RESPONSE_UNITS = [
  {
    id: 'MDRRMO',
    title: 'MDRRMO Rescue',
    subtitle: 'Disaster, flood, evacuation & search and rescue',
    icon: 'map',
    tone: 'teal',
    coverage: 'All 73 Barangays of Malasiqui',
    capabilities: 'Flood evacuation boats, landslide & storm response, mass-casualty coordination, and 24/7 command center oversight.',
  },
  {
    id: 'HEALTH_AMBULANCE',
    title: 'Health & Ambulance',
    subtitle: 'Medical emergencies, trauma & patient transport',
    icon: 'activity',
    tone: 'coral',
    coverage: 'Municipal Health Office & Emergency EMS',
    capabilities: 'Pre-hospital first aid, maternal & cardiac emergencies, trauma stabilization, and rapid hospital transport.',
  },
  {
    id: 'BFP_FIRE',
    title: 'BFP Fire Rescue',
    subtitle: 'Structure fires, gas leaks & hazardous incidents',
    icon: 'alert',
    tone: 'amber',
    coverage: 'Malasiqui Fire Station Response Grid',
    capabilities: 'Fire suppression, smoke/electrical hazard containment, vehicular extrication, and technical rescue operations.',
  },
  {
    id: 'PNP_POLICE',
    title: 'PNP Police Unit',
    subtitle: 'Public safety, crime response & security threats',
    icon: 'shield',
    tone: 'teal',
    coverage: 'Municipal Police Station Patrol Sectors',
    capabilities: 'Immediate security intervention, traffic collision response, crowd safety, and joint rescue escort.',
  },
];

const HAZARD_GUIDES = [
  { tag: 'Flood', time: '3 min read', title: 'Before floodwater rises', body: 'Move documents and essential items higher, charge your devices, and follow official barangay evacuation guidance.' },
  { tag: 'Typhoon', time: '4 min read', title: 'Prepare for severe weather', body: 'Secure loose outdoor objects, store 3 days of safe drinking water, and keep battery-powered lighting nearby.' },
  { tag: 'Earthquake', time: '2 min read', title: 'Drop, cover, and hold on', body: 'Protect your head and neck beneath sturdy furniture, away from glass windows and unsecured shelves.' },
  { tag: 'Household', time: '5 min read', title: 'Confirm your family contact plan', body: 'Keep your phone number and Malasiqui barangay address updated in RESCUE APP before an emergency happens.' },
];

const INITIAL_CHECKLIST = [
  { id: 'water', label: '3-day supply of drinking water & non-perishable food', done: true },
  { id: 'meds', label: 'First-aid kit & essential prescription medicines', done: true },
  { id: 'power', label: 'Charged powerbank, flashlight & extra batteries', done: false },
  { id: 'docs', label: 'Waterproof pouch with IDs & emergency cash', done: false },
  { id: 'whistle', label: 'Emergency whistle & hygiene essentials', done: false },
];

export default function LandingPage({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(2);
  const [radarPaused, setRadarPaused] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(RESPONSE_UNITS[0]);
  const [hazardFilter, setHazardFilter] = useState('All');
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);

  // Navbar scroll state
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-cycle live dispatch radar unless user is interacting with it
  useEffect(() => {
    if (radarPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveScenarioIndex((current) => (current + 1) % SCENARIOS.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [radarPaused]);

  // IntersectionObserver for scroll reveal animations
  useEffect(() => {
    const elements = document.querySelectorAll('.lp-reveal');
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const currentScenario = SCENARIOS[activeScenarioIndex];
  const currentWorkflow = WORKFLOW_STEPS[activeWorkflow];
  const filteredGuides = hazardFilter === 'All'
    ? HAZARD_GUIDES
    : HAZARD_GUIDES.filter((guide) => guide.tag === hazardFilter);
  const completedCount = checklist.filter((item) => item.done).length;
  const readinessPercent = Math.round((completedCount / checklist.length) * 100);

  function toggleChecklistItem(id) {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  function getDashboardPath() {
    if (!user) return '/login';
    if (user.role === 'respondent') return '/respondent/operations';
    if (user.role === 'admin') return '/admin/command-center';
    return '/citizen/overview';
  }

  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <header className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand__mark">
              <RescueLogo />
            </span>
            <span className="lp-brand__text">
              <strong>RESCUE APP</strong>
              <small>Malasiqui Response Network</small>
            </span>
          </Link>

          <nav className="lp-nav__links" aria-label="Landing sections">
            <a className="lp-nav__link" href="#how-it-works">How it works</a>
            <a className="lp-nav__link" href="#response-units">Response units</a>
            <a className="lp-nav__link" href="#preparedness">Preparedness</a>
          </nav>

          <div className="lp-nav__actions">
            {user ? (
              <Link className="lp-btn lp-btn--primary" to={getDashboardPath()}>
                Open your dashboard <AppIcon name="chevron" size={16} />
              </Link>
            ) : (
              <>
                <Link className="lp-btn lp-btn--ghost" to="/login">Sign in</Link>
                <Link className="lp-btn lp-btn--primary" to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive Dispatch Radar */}
      <section className="lp-hero">
        <div className="lp-hero__bg-glow" aria-hidden="true" />
        <div className="lp-hero__grid-pattern" aria-hidden="true" />

        <div className="lp-hero__inner">
          <div>
            <div className="lp-live-pill">
              <span className="lp-pulse-dot" aria-hidden="true" />
              <span>MALASIQUI, PANGASINAN • EMERGENCY COORDINATION NETWORK</span>
            </div>

            <h1 className="lp-hero__title">
              Faster rescue starts with{' '}
              <span className="lp-hero__title-accent">exact location</span> and live coordination.
            </h1>

            <p className="lp-hero__subtitle">
              Connect directly with Malasiqui’s MDRRMO, Ambulance, Fire, and Police units.
              Send verified GPS coordinates, landmark details, and chat live with responders when every second counts.
            </p>

            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--coral lp-btn--lg" to={user ? getDashboardPath() : '/login'}>
                <AppIcon name="alert" size={18} />
                {user ? 'Go to Emergency Center' : 'Request Emergency Help'}
              </Link>
              <Link className="lp-btn lp-btn--ghost lp-btn--lg" to="/register">
                <AppIcon name="shield" size={18} />
                Register Citizen or Responder
              </Link>
            </div>

            <div className="lp-hero__metrics">
              <div className="lp-metric">
                <strong>4 Units</strong>
                <span>MDRRMO, Ambulance, BFP Fire & PNP Police</span>
              </div>
              <div className="lp-metric">
                <strong>Live GPS</strong>
                <span>Meter-level location & barangay landmark pin</span>
              </div>
              <div className="lp-metric">
                <strong>2-Way Chat</strong>
                <span>Direct updates between citizen & responder</span>
              </div>
            </div>
          </div>

          {/* Interactive Dispatch Radar Preview */}
          <aside
            className="lp-console"
            aria-label="Interactive emergency dispatch simulation"
            onMouseEnter={() => setRadarPaused(true)}
            onMouseLeave={() => setRadarPaused(false)}
          >
            <div className="lp-console__topbar">
              <div className="lp-console__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span>MALASIQUI DISPATCH SIMULATOR</span>
              <span className="lp-console__status">
                <span className="lp-pulse-dot" aria-hidden="true" />
                {radarPaused ? 'Interactive mode' : 'Live preview'}
              </span>
            </div>

            <div className="lp-radar">
              <div className="lp-radar__grid" aria-hidden="true" />
              <div className="lp-radar__ring lp-radar__ring--1" aria-hidden="true" />
              <div className="lp-radar__ring lp-radar__ring--2" aria-hidden="true" />
              <div className="lp-radar__ring lp-radar__ring--3" aria-hidden="true" />
              <div className="lp-radar__sweep" aria-hidden="true" />

              {/* Animated SVG route line from Command Hub (50%,50%) to active incident pin */}
              <svg className="lp-radar__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line
                  className="lp-radar__route"
                  x1="50"
                  y1="50"
                  x2={currentScenario.coords.x}
                  y2={currentScenario.coords.y}
                  stroke="#7be0b3"
                  strokeWidth="0.9"
                />
                <circle
                  cx={currentScenario.coords.x}
                  cy={currentScenario.coords.y}
                  r="3.2"
                  fill="none"
                  stroke="#ff9c91"
                  strokeWidth="0.6"
                />
              </svg>

              <div className="lp-radar__hub">
                ✚ Command Center
              </div>

              {SCENARIOS.map((scenario, index) => {
                const isActive = index === activeScenarioIndex;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`lp-pin lp-pin--emergency${isActive ? ' lp-pin--active' : ''}`}
                    style={{ left: `${scenario.coords.x}%`, top: `${scenario.coords.y}%` }}
                    onClick={() => {
                      setActiveScenarioIndex(index);
                      setActiveStageIndex(2);
                    }}
                  >
                    <span
                      className={`lp-pulse-dot${isActive ? ' lp-pulse-dot--coral' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{scenario.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="lp-console__body">
              <div className="lp-console__scenario-bar" role="tablist" aria-label="Select simulated emergency">
                {SCENARIOS.map((scenario, index) => (
                  <button
                    key={scenario.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeScenarioIndex}
                    className={`lp-chip${index === activeScenarioIndex ? ' lp-chip--active' : ''}`}
                    onClick={() => setActiveScenarioIndex(index)}
                  >
                    {scenario.barangay} • {scenario.label}
                  </button>
                ))}
              </div>

              <div className="lp-console__card">
                <div className="lp-console__card-head">
                  <span className="lp-console__badge">
                    <AppIcon name="shield" size={13} /> {currentScenario.unit}
                  </span>
                  <span className="lp-console__eta">{currentScenario.eta}</span>
                </div>
                <h3>{currentScenario.title}</h3>
                <p>{currentScenario.summary}</p>

                <div className="lp-console__steps">
                  {currentScenario.steps.map((stepObj, idx) => (
                    <button
                      key={stepObj.stage}
                      type="button"
                      className={`lp-console__step${activeStageIndex === idx ? ' lp-console__step--active' : ''}`}
                      onClick={() => setActiveStageIndex(idx)}
                    >
                      <strong>{stepObj.stage}</strong>
                      <span>{stepObj.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Interactive Step-by-Step Walkthrough */}
      <section className="lp-section lp-reveal" id="how-it-works">
        <div className="lp-section__head">
          <p className="lp-eyebrow">Interactive workflow</p>
          <h2 className="lp-section__title">Designed for clarity under pressure</h2>
          <p className="lp-section__desc">
            Click through each stage below to see how an emergency report travels from a citizen’s phone to an assigned responder team.
          </p>
        </div>

        <div className="lp-sim-grid">
          <div className="lp-sim-tabs" role="tablist" aria-label="Emergency workflow steps">
            {WORKFLOW_STEPS.map((item, index) => {
              const active = index === activeWorkflow;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`lp-sim-tab${active ? ' lp-sim-tab--active' : ''}`}
                  onClick={() => setActiveWorkflow(index)}
                >
                  <span className="lp-sim-tab__num">{item.number}</span>
                  <span className="lp-sim-tab__copy">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="lp-sim-preview" role="tabpanel">
            <div>
              <div className="lp-sim-preview__header">
                <span className="lp-sim-preview__pill">
                  <AppIcon name="activity" size={14} /> {currentWorkflow.badge}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#74847a', fontWeight: 600 }}>
                  Interactive Preview
                </span>
              </div>

              <div className="lp-sim-preview__body">
                <h3>{currentWorkflow.heading}</h3>
                <p>{currentWorkflow.detail}</p>

                <div className="lp-sim-mock">
                  {currentWorkflow.rows.map((row) => (
                    <div className="lp-sim-mock__row" key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                {WORKFLOW_STEPS.map((stepItem, idx) => (
                  <button
                    key={stepItem.id}
                    type="button"
                    className="lp-btn lp-btn--ghost"
                    style={{
                      padding: '0.38rem 0.7rem',
                      fontSize: '0.75rem',
                      borderColor: idx === activeWorkflow ? '#245b51' : undefined,
                    }}
                    onClick={() => setActiveWorkflow(idx)}
                  >
                    Step {idx + 1}
                  </button>
                ))}
              </div>
              <Link className="lp-btn lp-btn--primary" to="/register">
                Set up your account <AppIcon name="chevron" size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Response Units Section */}
      <section className="lp-section lp-section--alt lp-reveal" id="response-units">
        <div className="lp-section__container">
          <div className="lp-section__head">
            <p className="lp-eyebrow">Connected agencies</p>
            <h2 className="lp-section__title">Direct routing to Malasiqui’s response units</h2>
            <p className="lp-section__desc">
              Select a unit below to explore how citizens and verified responders coordinate across different incident types.
            </p>
          </div>

          <div className="lp-units-grid">
            {RESPONSE_UNITS.map((unit) => {
              const isSelected = selectedUnit.id === unit.id;
              return (
                <article
                  key={unit.id}
                  className={`lp-unit-card lp-unit-card--${unit.tone}${isSelected ? ' lp-unit-card--selected' : ''}`}
                  onClick={() => setSelectedUnit(unit)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedUnit(unit);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                >
                  <div>
                    <div className="lp-unit-card__icon">
                      <AppIcon name={unit.icon} size={21} />
                    </div>
                    <h3>{unit.title}</h3>
                    <p>{unit.subtitle}</p>
                  </div>
                  <span className="lp-unit-card__tag">
                    {isSelected ? 'Selected unit' : 'Inspect unit details'} <AppIcon name="chevron" size={14} />
                  </span>
                </article>
              );
            })}
          </div>

          <div className="lp-unit-detail">
            <div style={{ maxWidth: '680px' }}>
              <p className="lp-eyebrow" style={{ marginBottom: '0.25rem' }}>{selectedUnit.coverage}</p>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.08rem' }}>{selectedUnit.title} — Operational Scope</h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#56665d', lineHeight: 1.55 }}>
                {selectedUnit.capabilities}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link className="lp-btn lp-btn--ghost" to="/register">
                Apply as {selectedUnit.title} Responder
              </Link>
              <Link className="lp-btn lp-btn--primary" to="/login">
                Request {selectedUnit.title}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Preparedness Guides & Go-Bag Readiness Widget */}
      <section className="lp-section lp-reveal" id="preparedness">
        <div className="lp-section__head">
          <p className="lp-eyebrow">Community readiness</p>
          <h2 className="lp-section__title">Prepare before an emergency happens</h2>
          <p className="lp-section__desc">
            Explore quick municipal hazard guides and test your household readiness with the interactive Go-Bag checklist.
          </p>
        </div>

        <div className="lp-prep-layout">
          <div>
            <div className="lp-hazard-filters" role="group" aria-label="Filter safety guides by hazard">
              {['All', 'Flood', 'Typhoon', 'Earthquake', 'Household'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`lp-filter-btn${hazardFilter === tag ? ' lp-filter-btn--active' : ''}`}
                  onClick={() => setHazardFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="lp-hazard-cards">
              {filteredGuides.map((guide) => (
                <article className="lp-hazard-card" key={guide.title}>
                  <div className="lp-hazard-card__meta">
                    <span className="lp-hazard-card__tag">{guide.tag}</span>
                    <span>{guide.time}</span>
                  </div>
                  <h3>{guide.title}</h3>
                  <p>{guide.body}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Interactive Go-Bag Checklist */}
          <aside className="lp-checklist" aria-label="Interactive emergency go-bag checklist">
            <div className="lp-checklist__head">
              <h3>Interactive Go-Bag Check</h3>
              <span className="lp-checklist__score">{readinessPercent}% Ready</span>
            </div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: '#56665d' }}>
              Tap items below to check off what your household already has packed:
            </p>
            <div className="lp-checklist__bar" aria-hidden="true">
              <div className="lp-checklist__bar-fill" style={{ width: `${readinessPercent}%` }} />
            </div>

            <div className="lp-checklist__items">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={item.done}
                  tabIndex={0}
                  className={`lp-check-item${item.done ? ' lp-check-item--done' : ''}`}
                  onClick={() => toggleChecklistItem(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleChecklistItem(item.id);
                    }
                  }}
                >
                  <span className="lp-check-box" aria-hidden="true">
                    {item.done ? <AppIcon name="check" size={13} /> : null}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="lp-section lp-reveal" style={{ paddingTop: 0 }}>
        <div className="lp-cta-banner">
          <div>
            <h2>Ready when every second counts.</h2>
            <p>
              Pre-register your household contact details and Malasiqui address today so responders have the right information immediately when you need help.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="lp-btn lp-btn--coral lp-btn--lg" to="/register">
              Create Free Account
            </Link>
            <Link
              className="lp-btn lp-btn--ghost lp-btn--lg"
              to="/login"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <strong style={{ color: '#18221e' }}>RESCUE APP</strong>
            <span>• Malasiqui Emergency Response Network</span>
          </div>
          <nav className="lp-footer__links" aria-label="Footer links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
            <Link to="/terms">Terms of use</Link>
            <Link to="/privacy">Privacy notice</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
