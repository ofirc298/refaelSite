// frontend/lib/api.js

export const API = (process.env.NEXT_PUBLIC_API || 'http://localhost:4001/api')
  .trim()
  .replace(/\/$/, ''); 

export const API_ORIGIN = API.replace(/\/api$/, '');

export function asURL(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;   
  const path = u.startsWith('/') ? u : `/${u}`;
  return API_ORIGIN + path;             
}

export function normalizeImage(u) {
  if (!u) return '';
  u = u.replace(/^https?:\/\/localhost:\d+/i, API_ORIGIN);
  return asURL(u);
}

export async function fetchJSON(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || ('HTTP ' + res.status));
  return data;
}

export async function adminFetch(path, { method = 'GET', body, headers } = {}) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || '') : '';
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || ('HTTP ' + res.status));
  return data;
}

export async function adminUpload(path, formData) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || '') : '';
  const res = await fetch(API + path, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || ('HTTP ' + res.status));
  return data;
}
