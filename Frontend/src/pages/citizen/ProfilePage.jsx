import ProfileEditor from '../../components/ProfileEditor';

export default function ProfilePage({ user, onUserUpdated }) {
  return (
    <ProfileEditor
      user={user}
      onUserUpdated={onUserUpdated}
      description="Accurate contact information helps responders identify and reach you during an incident."
    />
  );
}
