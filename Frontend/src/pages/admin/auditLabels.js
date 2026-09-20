export const AUDIT_ACTIONS = {
  ACCOUNT_REGISTERED: 'Account registered',
  ACCOUNT_REGISTRATION_UPDATED: 'Registration updated',
  EMAIL_VERIFIED: 'Email verified',
  LOGIN_PASSWORD: 'Signed in with password',
  LOGIN_GOOGLE: 'Signed in with Google',
  LOGOUT: 'Signed out',
  PROFILE_UPDATED: 'Profile updated',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
  PASSWORD_RESET_COMPLETED: 'Password reset completed',
  RESPONDER_APPLICATION_APPROVED: 'Responder application approved',
  RESPONDER_APPLICATION_REJECTED: 'Responder application rejected',
  EMERGENCY_CREATED: 'Emergency requested',
  EMERGENCY_ACCEPTED: 'Emergency accepted',
  RESPONDER_EN_ROUTE: 'Responder en route',
  EMERGENCY_RESOLVED: 'Emergency resolved',
  CHAT_MESSAGE_SENT: 'Chat message sent',
  USER_BLOCKED: 'User blocked',
  USER_UNBLOCKED: 'User unblocked',
};

export function auditActionLabel(action) {
  return AUDIT_ACTIONS[action] || action.replaceAll('_', ' ').toLowerCase();
}
