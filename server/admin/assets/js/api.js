// Allow overriding the backend origin from the page (useful when admin
// UI runs on a different origin/port). If `window.__API_ORIGIN__` is set
// it will be used as the backend origin, otherwise fall back to the
// relative `/api/admin` path (works when served by the backend itself).
const API_ORIGIN = (typeof window !== "undefined" && window.__API_ORIGIN__) ? window.__API_ORIGIN__ : "";
const BASE = API_ORIGIN ? `${API_ORIGIN.replace(/\/$/, '')}/api/admin` : "/api/admin";
export { BASE };

// ── Token ──────────────────────────────────────────────────────────
// We no longer store the JWT in localStorage. The server sets an HttpOnly
// cookie `roof_admin_token` on login. For the UI we keep a non-sensitive
// local flag to track whether we're authenticated for redirect decisions.
export const token = {
  get:    ()    => localStorage.getItem("roof_admin_logged_in"),
  set:    ()    => { try { localStorage.setItem("roof_admin_logged_in", "1"); } catch (ignored) { /* ignore */ } },
  remove: ()    => { try { localStorage.removeItem("roof_admin_logged_in"); } catch (ignored) { /* ignore */ } },
  exists: ()    => !!localStorage.getItem("roof_admin_logged_in"),
};

// ── Core request ───────────────────────────────────────────────────
async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Session expired or invalid token: remove token and redirect to login.
    token.remove();
    try { localStorage.setItem('roof_session_expired', '1'); } catch (ignored) { /* ignore */ }
    // Redirect to the admin login page (relative path).
    window.location.href = 'index.html';
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw new Error(data.error || `خطای ${res.status}`);
  return data;
}

// ── Auth ───────────────────────────────────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "خطا در ورود");
  return data; // { success: true }
}

// ── Reviews ────────────────────────────────────────────────────────
export const reviews = {
  getAll: ()         => req("GET",    "/reviews"),
  update: (id, body) => req("PATCH",  `/reviews/${id}`, body),
  delete: (id)       => req("DELETE", `/reviews/${id}`),
};

// ── Products ───────────────────────────────────────────────────────
export const products = {
  getAll: ()         => req("GET",    "/products"),
  create: (body)     => req("POST",   "/products", body),
  update: (id, body) => req("PATCH",  `/products/${id}`, body),
  delete: (id)       => req("DELETE", `/products/${id}`),
};

// ── Categories ─────────────────────────────────────────────────────
export const categories = {
  getAll: ()         => req("GET",    "/categories"),
  create: (body)     => req("POST",   "/categories", body),
  update: (id, body) => req("PATCH",  `/categories/${id}`, body),
  delete: (id)       => req("DELETE", `/categories/${id}`),
};

// ── Admins (management)
export const admins = {
  getAll: ()         => req('GET',    '/admins'),
  create: (body)     => req('POST',   '/admins', body),
  update: (id, body) => req('PATCH',  `/admins/${id}`, body),
  delete: (id)       => req('DELETE', `/admins/${id}`),
};

export const auth = {
  me: () => req('GET', '/me'),
};

// Upload image (multipart/form-data)
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    token.remove();
    try { localStorage.setItem('roof_session_expired', '1'); } catch (ignored) {
      // ignore localStorage errors
    }
    window.location.href = 'index.html';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(data.error || `خطای ${res.status}`);
  return data; // expected { filename }
}
