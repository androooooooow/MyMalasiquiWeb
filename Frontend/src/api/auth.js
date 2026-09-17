import axios from 'axios';

// Keep the API address configurable for deployment, while matching the local
// Express server that is already in this project.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
  const { data } = await api.post('/auth/google', { credential });
  return data;
}

export async function verifyEmail(token) {
  const { data } = await api.post('/auth/verify-email', { token });
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
