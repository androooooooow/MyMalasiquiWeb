import axios from 'axios';
import { apiBaseUrl } from './baseUrl';

const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchConversations() {
  const { data } = await api.get('/chats/conversations');
  return data.conversations;
}

export async function openConversation(responderUnit) {
  const { data } = await api.post('/chats/conversations', { responderUnit });
  return data.conversation;
}

export async function fetchMessages(conversationId) {
  const { data } = await api.get(`/chats/conversations/${encodeURIComponent(conversationId)}/messages`);
  return data.messages;
}

export async function sendChatMessage(conversationId, body) {
  const { data } = await api.post(`/chats/conversations/${encodeURIComponent(conversationId)}/messages`, { body });
  return data.message;
}

export function chatStreamUrl() {
  return `${apiBaseUrl().replace(/\/$/, '')}/chats/stream`;
}
