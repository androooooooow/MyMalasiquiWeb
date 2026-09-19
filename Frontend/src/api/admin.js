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

export async function fetchAdminAuditLog(page) {
  const { data } = await api.get('/admin/audit-log', { params: { page } });
  return data;
}

export function adminError(error, fallback) {
  return error?.response?.data?.message || fallback;
}
