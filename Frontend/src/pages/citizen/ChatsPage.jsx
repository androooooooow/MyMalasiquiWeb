import ChatWorkspace from '../../components/ChatWorkspace';

export default function ChatsPage({ user }) {
  return (
    <>
      <div className="rescue-page-head">
        <div>
          <p className="rescue-eyebrow">Communications</p>
          <h1 className="rescue-page-title">Messages</h1>
          <p className="rescue-page-lede">Chat directly with the response unit you need.</p>
        </div>
      </div>
      <ChatWorkspace user={user} />
    </>
  );
}
