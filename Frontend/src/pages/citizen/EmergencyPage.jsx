const HOTLINES = [
  { name: 'Malasiqui MDRRMO', number: '(075) 632-1234', note: 'Municipal disaster response, 24/7' },
  { name: 'Malasiqui Police Station', number: '117 / (075) 632-5678', note: 'Police emergency line' },
  { name: 'Municipal Fire Station', number: '(075) 632-4455', note: 'Fire and rescue' },
  { name: 'Rural Health Unit', number: '(075) 632-8899', note: 'Medical emergencies, ambulance dispatch' },
];

export default function EmergencyPage() {
  return (
    <section aria-labelledby="emergency-title">
      <p className="dashboard-card__eyebrow citizen-page-eyebrow--urgent">In case of emergency</p>
      <h1 id="emergency-title" className="citizen-page-title">Emergency contacts</h1>
      <p className="citizen-page-lede">
        Call the number that matches your situation. If a line does not answer, try the
        MDRRMO hotline first — it can redirect you to the right responder.
      </p>

      <ul className="citizen-hotline-list">
        {HOTLINES.map((line) => (
          <li className="citizen-hotline" key={line.name}>
            <div className="citizen-hotline__info">
              <span className="citizen-hotline__name">{line.name}</span>
              <span className="citizen-hotline__note">{line.note}</span>
            </div>
            <a className="citizen-hotline__number" href={`tel:${line.number.replace(/[^\d+]/g, '')}`}>
              {line.number}
            </a>
          </li>
        ))}
      </ul>

      <div className="citizen-address-card">
        <span className="citizen-address-card__label">Rescue center address</span>
        <p className="citizen-address-card__value">
          Malasiqui Municipal Disaster Risk Reduction and Management Office,
          Poblacion, Malasiqui, Pangasinan
        </p>
      </div>
    </section>
  );
}