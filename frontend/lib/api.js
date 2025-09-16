// frontend/lib/api.js

// בסיס ה-API (ב-Netlify להגדיר: NEXT_PUBLIC_API=https://<backend>/api)
export const API = (process.env.NEXT_PUBLIC_API || 'http://localhost:4001/api')
  .trim()
  .replace(/\/$/, ''); // ללא '/' בסוף

// מקור ה-backend ללא '/api' – להרכבת כתובות תמונה
export const API_ORIGIN = API.replace(/\/api$/, '');

/** ממיר נתיב/URL לתמונה ל-URL מלא של ה-backend */
export function asURL(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;   // כבר URL מלא
  const path = u.startsWith('/') ? u : `/${u}`;
  return API_ORIGIN + path;                  // למשל: https://backend/uploads/abc.jpg
}

/** מנרמל ערכים שנשמרו עם localhost ומחזיר URL מלא תקין */
export function normalizeImage(u) {
  if (!u) return '';
  // מחליף localhost מהפיתוח במקור הנכון של ה-backend
  u = u.replace(/^https?:\/\/localhost:\d+/i, API_ORIGIN);
  return asURL(u);
}

/** בקשה כללית JSON */
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

/** בקשות אדמין עם Bearer token */
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

/** העלאת קבצים (תמונות) עם טוקן אדמין */
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
