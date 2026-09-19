export function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  if (!import.meta.env.DEV) return configured;

  try {
    const url = new URL(configured);
    const pageHost = window.location.hostname;
    if (['localhost', '127.0.0.1'].includes(pageHost)
      && ['localhost', '127.0.0.1'].includes(url.hostname)) {
      url.hostname = pageHost;
      return url.toString();
    }
  } catch {
    // Leave custom or relative API URLs unchanged.
  }
  return configured;
}
