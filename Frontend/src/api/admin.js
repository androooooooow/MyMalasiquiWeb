import axios from 'axios';
import { apiBaseUrl } from './baseUrl';

const api = axios.create({ baseURL: apiBaseUrl(), withCredentials: true, timeout: 10000 });

export async function fetchAdminOverview() {
  const { data } = await api.get('/admin/overview');
  return data;
}

export async function fetchAdminUsers(filters) {
  const { data } = await api.get('/admin/users', { params: filters });
  return data;
}

export async function setUserBlocked(id, blocked, reason) {
  const { data } = await api.patch(`/admin/users/${id}/block`, { blocked, ...(blocked ? { reason } : {}) });
  return data.user;
}

export async function fetchIncidentAnalytics(period) {
  const { data } = await api.get('/admin/analytics', { params: { period } });
  return data;
}

export async function fetchAdminAuditLog(filters) {
  const { data } = await api.get('/admin/audit-log', { params: filters });
  return data;
}

export async function fetchResponderApplications(filters) {
  const { data } = await api.get('/admin/responder-applications', { params: filters });
  return data;
}

export async function approveResponderApplication(id) {
  const { data } = await api.post(`/admin/responder-applications/${id}/approve`, {}, { timeout: 30000 });
  return data;
}

export async function rejectResponderApplication(id, reason) {
  const { data } = await api.post(`/admin/responder-applications/${id}/reject`, { reason }, { timeout: 30000 });
  return data;
}

export async function resendResponderApprovalEmail(id) {
  const { data } = await api.post(`/admin/responder-applications/${id}/resend-verification`, {}, { timeout: 30000 });
  return data;
}

export function adminError(error, fallback) {
  return error?.response?.data?.message || fallback;
}
