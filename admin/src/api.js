// Fetch helper for the admin dashboard. Uses a separate token from runners.
const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "mrpace_admin_token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/admin/login") onUnauthorized();
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const mediaUrl = (p) => (!p ? "" : p.startsWith("http") ? p : `${API_BASE}${p}`);
export const money = (n) => (Number(n) > 0 ? `US$${Number(n).toFixed(2)}` : "Free");
export const formatDate = (iso, opts) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...opts });
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
