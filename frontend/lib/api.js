// lib/api.js
const API = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API)
  ? process.env.NEXT_PUBLIC_API.replace(/\/$/, '')
  : '';

function joinUrl(base, path) {
  if (!base) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function fetchWithTimeout(url, init = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchJSON(path, init = {}, opts = {}) {
  const { timeoutMs = 10000 } = opts;
  const url = joinUrl(API, path);
  const res = await fetchWithTimeout(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  }, timeoutMs);
  if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
  try { return await res.json(); } catch { return {}; }
}
