import { useState } from 'react';

const SAMPLE_THREADS = [
  {
    id: 'thread-1',
    name: 'MDRRMO Response Team',
    preview: 'Your request has been received. A team is on the way.',
    time: '9:42 AM',
  },
  {
    id: 'thread-2',
    name: 'Barangay Update',
    preview: 'Reminder: water distribution today at the covered court.',
    time: 'Yesterday',
  },
];

export default function ChatsPage({ user }) {
  const [activeThread, setActiveThread] = useState(SAMPLE_THREADS[0].id);
  const thread = SAMPLE_THREADS.find((t) => t.id === activeThread);

  return (
    <section aria-labelledby="chats-title">
      <p className="dashboard-card__eyebrow">Messages</p>
      <h1 id="chats-title" className="citizen-page-title">Chats</h1>
      <p className="citizen-page-lede">
        This is a preview layout. Messages here are placeholders until chat is connected
        to live conversations.
      </p>

      <div className="citizen-chat-layout">
        <ul className="citizen-thread-list" aria-label="Conversations">
          {SAMPLE_THREADS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`citizen-thread${t.id === activeThread ? ' citizen-thread--active' : ''}`}
                onClick={() => setActiveThread(t.id)}
                aria-current={t.id === activeThread ? 'true' : undefined}
              >
                <span className="citizen-thread__name">{t.name}</span>
                <span className="citizen-thread__preview">{t.preview}</span>
                <span className="citizen-thread__time">{t.time}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="citizen-chat-panel">
          {thread ? (
            <>
              <div className="citizen-chat-panel__header">{thread.name}</div>
              <div className="citizen-chat-panel__body">
                <div className="citizen-chat-bubble citizen-chat-bubble--them">
                  {thread.preview}
                </div>
                <div className="citizen-chat-bubble citizen-chat-bubble--me">
                  Thank you, please keep me posted.
                </div>
              </div>
              <form
                className="citizen-chat-panel__composer"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder="Type a message…"
                  aria-label={`Message ${thread.name}`}
                  disabled
                />
                <button type="submit" disabled>Send</button>
              </form>
            </>
          ) : (
            <p className="citizen-chat-panel__empty">Select a conversation to view it.</p>
          )}
        </div>
      </div>
    </section>
  );
}