import ChatWorkspace from '../../components/ChatWorkspace';
import PageHeader from './components/PageHeader';

export default function CommunicationsPage({ user }) {
  return (
    <>
      <PageHeader title="Communications" description="Live messages from citizens assigned to your response unit." />
      <ChatWorkspace user={user} />
    </>
  );
}
