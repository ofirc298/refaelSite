// lib/cache.js
const LS = typeof window !== 'undefined' ? window.localStorage : null;
export function getCache(key) {
  if (!LS) return null;
  try {
    const raw = LS.getItem(key);
    if (!raw) return null;
    const { v, t, ttl } = JSON.parse(raw);
    if (ttl && Date.now() - t > ttl) return null;
    return v;
  } catch { return null; }
}
export function setCache(key, value, ttlMs = 300000) {
  if (!LS) return;
  try { LS.setItem(key, JSON.stringify({ v: value, t: Date.now(), ttl: ttlMs })); } catch {}
}
