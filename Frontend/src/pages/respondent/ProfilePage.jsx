import ProfileEditor from '../../components/ProfileEditor';

export default function ProfilePage({ user, onUserUpdated, unitLabel }) {
  return (
    <ProfileEditor
      user={user}
      onUserUpdated={onUserUpdated}
      unitLabel={unitLabel}
      description="Keep your responder identity and contact details accurate for dispatch coordination."
    />
  );
}
