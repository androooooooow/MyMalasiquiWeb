import axios from 'axios';
import { apiBaseUrl } from './baseUrl';

// Keep the API address configurable for deployment, while matching the local
// Express server that is already in this project.
const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/session');
  return data.user;
}

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function register(details) {
  const { data } = await api.post('/auth/register', details);
  return data;
}

export async function googleLogin(credential) {
  const { data } = await api.post('/auth/google', { credential }, { timeout: 30000 });
  return data;
}

export async function updateProfile(profile) {
  const { data } = await api.patch('/auth/profile', profile);
  return data;
}

export async function verifyEmail(email, code) {
  const { data } = await api.post('/auth/verify-email', { email, code });
  return data;
}

export async function resendVerification(email) {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}

export function getRequestError(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}
