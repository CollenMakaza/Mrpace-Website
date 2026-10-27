// Small fetch helper for talking to the Mr Pace backend.
const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "mrpace_token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error("Can't reach the Mr Pace server. Check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Something went wrong.");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Turns "/uploads/x.jpg" from the API into a full URL.
export const mediaUrl = (p) => (!p ? "" : p.startsWith("http") ? p : `${API_BASE}${p}`);

export const money = (n) => (Number(n) > 0 ? `US$${Number(n).toFixed(2)}` : "Free");

export const formatDate = (iso, opts) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...opts });

export const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
