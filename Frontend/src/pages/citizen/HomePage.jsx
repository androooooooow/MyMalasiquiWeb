const QUICK_LINKS = [
  {
    key: 'emergency',
    title: 'Report an emergency',
    body: 'Find hotline numbers and the rescue center address in one place.',
  },
  {
    key: 'knowledge',
    title: 'Read safety guides',
    body: 'Learn what to do before, during, and after common local hazards.',
  },
  {
    key: 'chats',
    title: 'Open your messages',
    body: 'Check updates and conversations with the rescue team.',
  },
];

export default function HomePage({ user, onNavigate }) {
  const firstName = (user?.name || user?.email || 'there').split(' ')[0];

  return (
    <section aria-labelledby="home-title">
      <p className="dashboard-card__eyebrow">You are signed in</p>
      <h1 id="home-title" className="citizen-page-title">Welcome, {firstName}.</h1>
      <p className="citizen-page-lede">
        This is your Malasiqui Rescue account. Use the sections on the left to manage your
        profile, reach responders, learn safety steps, and read your messages.
      </p>

      <div className="citizen-quicklinks" role="list">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.key}
            type="button"
            className="citizen-quicklink"
            role="listitem"
            onClick={() => onNavigate(link.key)}
          >
            <span className="citizen-quicklink__title">{link.title}</span>
            <span className="citizen-quicklink__body">{link.body}</span>
            <span className="citizen-quicklink__arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}