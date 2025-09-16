// lib/api.js
const API = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API)
  ? process.env.NEXT_PUBLIC_API.replace(/\/$/, '')
  : '';

function joinUrl(base, path) {
  if (!base) return path; // allow relative (e.g., when using Next.js rewrite/proxy)
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function fetchWithTimeout(url, init = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchRetry(path, init = {}, opts = {}) {
  const { retries = 2, delayMs = 800, timeoutMs = 12000 } = opts;
  let lastErr;
  const url = joinUrl(API, path);
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetchWithTimeout(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      }, timeoutMs);
      if (!res.ok) {
        throw new Error(res.statusText || `HTTP ${res.status}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i === retries) break;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i))); // exp backoff
    }
  }
  throw lastErr;
}

export async function fetchJSON(path, init = {}, opts = {}) {
  const res = await fetchRetry(path, init, opts);
  try {
    return await res.json();
  } catch {
    return {};
  }
}
