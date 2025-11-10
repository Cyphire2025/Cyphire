// src/lib/fetch.js
// Production-safe CSRF helper that works across domains (Vercel ↔ Render)

let _csrfToken = null;
let _csrfPromise = null;

const API_BASE =
  (typeof import !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  (typeof import !== "undefined" && import.meta?.env?.VITE_API_URL) ||
  "http://localhost:5000";

function originOf(u) {
  try { return new URL(u).origin; } catch { return ""; }
}

const backendOrigin = originOf(API_BASE);

// Fetch and cache CSRF token from backend JSON endpoint.
// Backend should also set the same value in the httpOnly cookie.
async function getCsrfToken() {
  if (_csrfToken) return _csrfToken;
  if (_csrfPromise) return _csrfPromise;

  _csrfPromise = fetch(`${backendOrigin}/csrf-token`, {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  })
    .then(async (r) => {
      if (!r.ok) return null;
      const data = await r.json().catch(() => null);
      return data?.csrfToken || null;
    })
    .then((tok) => {
      _csrfToken = tok || null;
      return _csrfToken;
    })
    .finally(() => { _csrfPromise = null; });

  return _csrfPromise;
}

// Unified fetch with CSRF + credentials for backend, safe defaults elsewhere.
export async function apiFetch(input, options = {}) {
  const method = String(options.method || "GET").toUpperCase();

  // Normalize URL and compute target origin
  let url = typeof input === "string" ? input : input?.url || String(input);
  try { url = new URL(url, window.location.href).href; } catch {}

  const targetOrigin = originOf(url);
  const isBackend = targetOrigin === backendOrigin;
  const isUnsafe = /^(POST|PUT|PATCH|DELETE)$/.test(method);

  const headers = new Headers(options.headers || {});
  const final = { ...options, headers };

  if (isBackend) {
    // Always send cookies to your API
    final.credentials = "include";

    // For unsafe methods, attach CSRF token from the backend JSON endpoint
    if (isUnsafe) {
      const token = await getCsrfToken();
      if (token) headers.set("X-CSRF-Token", token);
    }
  }

  // IMPORTANT: don't set Content-Type when sending FormData—let the browser set boundary
  return fetch(url, final);
}
