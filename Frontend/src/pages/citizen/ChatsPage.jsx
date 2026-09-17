import { useState } from 'react';
import AppIcon from '../../components/AppIcon';

const THREADS = [
  { id: 'response', name: 'MDRRMO Response Desk', preview: 'Your safety is our priority.', time: '9:42 AM' },
  { id: 'barangay', name: 'Barangay Updates', preview: 'Community advisory preview', time: 'Yesterday' },
];

export default function ChatsPage() {
  const [activeThread, setActiveThread] = useState(THREADS[0].id);
  const thread = THREADS.find((item) => item.id === activeThread);

  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Communications</p>
          <h1 className="rescue-page-title">Messages</h1>
          <p className="rescue-page-lede">A clear conversation space for updates from the response team and your barangay.</p>
        </div>
        <span className="rescue-status-pill rescue-status-pill--amber">Frontend preview</span>
      </div>

      <section className="rescue-card rescue-chat">
        <div className="rescue-chat__threads">
          <div className="rescue-chat__search">
            <AppIcon name="search" size={15} />
            <input type="search" placeholder="Search conversations" aria-label="Search conversations" />
          </div>
          <ul className="rescue-chat__list">
            {THREADS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`rescue-chat__thread${item.id === activeThread ? ' rescue-chat__thread--active' : ''}`}
                  onClick={() => setActiveThread(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.preview}</span>
                  <span>{item.time}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rescue-chat__panel">
          <header className="rescue-chat__header">
            <span className="rescue-chat__header-avatar">MR</span>
            <span><strong>{thread?.name}</strong><small>Official channel · Preview</small></span>
          </header>
          <div className="rescue-chat__messages">
            <span className="rescue-chat__bubble rescue-chat__bubble--them">Welcome to the redesigned RESCUE APP message center.</span>
            <span className="rescue-chat__bubble rescue-chat__bubble--me">Thank you. I can see the new interface clearly.</span>
            <span className="rescue-empty-note">Messaging is visual-only until realtime chat is connected to the backend.</span>
          </div>
          <form className="rescue-chat__composer" onSubmit={(event) => event.preventDefault()}>
            <input type="text" placeholder="Messaging will be enabled later" disabled />
            <button className="rescue-button rescue-button--primary rescue-button--small" type="submit" disabled>Send</button>
          </form>
        </div>
      </section>
    </>
  );
}
