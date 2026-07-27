const GUIDES = [
  {
    title: 'Before a flood',
    body: 'Move valuables and documents to a higher level, charge your phone and any power banks, and keep a battery radio nearby for updates.',
  },
  {
    title: 'During an earthquake',
    body: 'Drop, cover, and hold on under sturdy furniture. Stay away from windows and tall shelves until the shaking stops.',
  },
  {
    title: 'After a typhoon',
    body: 'Check your home for damage before re-entering. Avoid downed power lines and standing floodwater, which can be electrically charged.',
  },
  {
    title: 'Building a go-bag',
    body: 'Pack water, non-perishable food, a flashlight, first-aid kit, copies of important documents, and any regular medication.',
  },
];

export default function KnowledgePage() {
  return (
    <section aria-labelledby="knowledge-title">
      <p className="dashboard-card__eyebrow">Stay prepared</p>
      <h1 id="knowledge-title" className="citizen-page-title">Safety knowledge</h1>
      <p className="citizen-page-lede">
        Short guides on common hazards in the area. Read these before an emergency happens,
        not during one.
      </p>

      <div className="citizen-guide-list">
        {GUIDES.map((guide) => (
          <article className="citizen-guide" key={guide.title}>
            <h2 className="citizen-guide__title">{guide.title}</h2>
            <p className="citizen-guide__body">{guide.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}