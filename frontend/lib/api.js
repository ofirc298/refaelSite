export const API = (process.env.NEXT_PUBLIC_API?.replace(/\/$/, '') || 'http://localhost:4001/api');

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
