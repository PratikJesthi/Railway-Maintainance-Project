const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const TOKEN_KEY = 'sanchalan_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('sanchalan:unauthorized'));
  }
  return res;
}

/** apiFetch + JSON parse + throw on non-2xx, so callers can just `await apiJson(...)`. */
export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `${path} failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** ws://.../ws/feed or wss://.../ws/feed, derived from the same BASE as REST calls. */
export function wsUrl() {
  return BASE.replace(/^http/, 'ws') + '/ws/feed';
}

export { BASE };

export const api = {
  get: (path, options) => apiJson(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiJson(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body, options) => apiJson(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, options) => apiJson(path, { ...options, method: 'DELETE' }),
};

apiJson.get = api.get;
apiJson.post = api.post;
apiJson.patch = api.patch;
apiJson.delete = api.delete;

export default apiJson;
