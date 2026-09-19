import { useCallback, useEffect, useRef, useState } from 'react';
import { chatStreamUrl, fetchConversations, fetchMessages, openConversation, sendChatMessage } from '../api/chats';

const UNITS = [
  { id: 'HEALTH_AMBULANCE', name: 'Health / Ambulance' },
  { id: 'PNP_POLICE', name: 'PNP / Police' },
  { id: 'BFP_FIRE', name: 'BFP / Fire' },
  { id: 'MDRRMO', name: 'MDRRMO' },
];

function unitName(unit) {
  return UNITS.find((item) => item.id === unit)?.name || unit;
}

function timeLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function ChatWorkspace({ user }) {
  const isCitizen = user.role === 'citizen';
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const selectedIdRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const bottomRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    const items = await fetchConversations();
    setConversations(items);
    if (!selectedIdRef.current && items.length > 0 && !isCitizen) {
      selectedIdRef.current = items[0].id;
      setSelectedId(items[0].id);
    }
  }, [isCitizen]);

  const refreshMessages = useCallback(async (id) => {
    if (!id) return;
    const items = await fetchMessages(id);
    if (selectedIdRef.current === id) setMessages(items);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await refreshConversations();
      } catch (err) {
        if (active) setError(errorMessage(err, 'Could not load conversations.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();

    const stream = new EventSource(chatStreamUrl(), { withCredentials: true });
    const refresh = () => {
      if (!active) return;
      setLive(true);
      refreshConversations().catch(() => {});
      if (selectedIdRef.current) refreshMessages(selectedIdRef.current).catch(() => {});
    };
    stream.addEventListener('ready', refresh);
    stream.addEventListener('refresh', refresh);
    stream.onerror = () => { if (active) setLive(false); };
    return () => {
      active = false;
      stream.close();
    };
  }, [refreshConversations, refreshMessages]);

  useEffect(() => {
    if (!selectedId) return;
    refreshMessages(selectedId).catch((err) => setError(errorMessage(err, 'Could not load messages.')));
  }, [selectedId, refreshMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  function selectConversation(conversation) {
    if (selectedIdRef.current === conversation.id) return;
    selectedIdRef.current = conversation.id;
    setSelectedId(conversation.id);
    setMessages([]);
    setError('');
  }

  async function selectUnit(unit) {
    const existing = conversations.find((conversation) => conversation.responderUnit === unit);
    if (existing) return selectConversation(existing);
    setBusy(true);
    setError('');
    try {
      const conversation = await openConversation(unit);
      selectConversation(conversation);
      await refreshConversations();
    } catch (err) {
      setError(errorMessage(err, 'Could not open this conversation.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || busy) return;
    setBusy(true);
    setError('');
    try {
      await sendChatMessage(selectedId, body);
      setDraft('');
      await Promise.all([refreshMessages(selectedId), refreshConversations()]);
    } catch (err) {
      setError(errorMessage(err, 'Message was not sent. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const visibleConversations = conversations.filter((conversation) =>
    conversation.citizen.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <section className="rescue-card rescue-chat" aria-label="Messages">
      <div className="rescue-chat__threads">
        {isCitizen ? (
          <>
            <p className="rescue-chat__sidebar-title">Choose a response unit</p>
            <ul className="rescue-chat__list">
              {UNITS.map((unit) => {
                const conversation = conversations.find((item) => item.responderUnit === unit.id);
                return (
                  <li key={unit.id}>
                    <button type="button" disabled={busy}
                      className={`rescue-chat__thread${selected?.responderUnit === unit.id ? ' rescue-chat__thread--active' : ''}`}
                      onClick={() => selectUnit(unit.id)}>
                      <strong>{unit.name}</strong>
                      <span>{conversation?.lastMessage?.body || 'Start a conversation'}</span>
                      {conversation?.lastMessage && <span>{timeLabel(conversation.lastMessage.createdAt)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <div className="rescue-chat__search">
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search citizens" aria-label="Search citizens" />
            </div>
            <ul className="rescue-chat__list">
              {visibleConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button type="button" className={`rescue-chat__thread${selectedId === conversation.id ? ' rescue-chat__thread--active' : ''}`}
                    onClick={() => selectConversation(conversation)}>
                    <strong>{conversation.citizen.name}</strong>
                    <span>{conversation.lastMessage?.body || 'New conversation'}</span>
                    <span>{timeLabel(conversation.lastMessage?.createdAt || conversation.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!loading && visibleConversations.length === 0 && <p className="rescue-chat__side-note">No citizen conversations yet.</p>}
          </>
        )}
      </div>

      <div className="rescue-chat__panel">
        <header className="rescue-chat__header">
          <span className="rescue-chat__header-avatar" aria-hidden="true">{isCitizen ? 'R' : 'C'}</span>
          <span>
            <strong>{selected ? (isCitizen ? unitName(selected.responderUnit) : selected.citizen.name) : 'Select a conversation'}</strong>
            <small>{live ? 'Live updates connected' : 'Reconnecting live updates…'}</small>
          </span>
        </header>
        {error && <p className="rescue-chat__error" role="alert">{error}</p>}
        <div className="rescue-chat__messages" role="log" aria-live="polite" aria-label="Conversation messages">
          {!selected && <p className="rescue-empty-note">{isCitizen ? 'Select Health, PNP, BFP, or MDRRMO to send a message.' : 'Choose a citizen conversation from your unit inbox.'}</p>}
          {selected && messages.length === 0 && <p className="rescue-empty-note">No messages yet. Start the conversation below.</p>}
          {messages.map((message) => (
            <div key={message.id} className={`rescue-chat__message${message.senderId === user.id ? ' rescue-chat__message--me' : ''}`}>
              <span className={`rescue-chat__bubble${message.senderId === user.id ? ' rescue-chat__bubble--me' : ' rescue-chat__bubble--them'}`}>{message.body}</span>
              <small>{message.sender.name} · {timeLabel(message.createdAt)}</small>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form className="rescue-chat__composer" onSubmit={submitMessage}>
          <input type="text" value={draft} onChange={(event) => setDraft(event.target.value)}
            placeholder={selected ? 'Type a message…' : 'Select a conversation first'}
            aria-label="Message" maxLength={2000} disabled={!selected || busy} />
          <button className="rescue-button rescue-button--primary rescue-button--small" type="submit"
            disabled={!selected || !draft.trim() || busy}>Send</button>
        </form>
      </div>
    </section>
  );
}
