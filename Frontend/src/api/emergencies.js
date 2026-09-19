import axios from 'axios';
import { apiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function createEmergencyRequest(request) {
  const { data } = await api.post('/emergencies', request);
  return data;
}

export async function fetchMyEmergencyRequests() {
  const { data } = await api.get('/emergencies/mine');
  return data.emergencies;
}

export async function fetchActiveEmergencyRequest() {
  const { data } = await api.get('/emergencies/active');
  return data.emergency;
}

export async function fetchResponderQueue() {
  const { data } = await api.get('/respondent-actions/queue');
  return data.emergencies;
}

export async function fetchResponseTeam() {
  const { data } = await api.get('/respondent-actions/team');
  return data.members;
}

export async function acceptEmergencyRequest(id) {
  const { data } = await api.patch(`/respondent-actions/${id}/accept`);
  return data.emergency;
}

export async function updateEmergencyStatus(id, status) {
  const { data } = await api.patch(`/respondent-actions/${id}/status`, { status });
  return data.emergency;
}

export async function updateResponderLocation(id, location) {
  const { data } = await api.patch(`/respondent-actions/${id}/responder-location`, location);
  return data.emergency;
}

export function getEmergencyError(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}
