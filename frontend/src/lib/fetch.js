// src/lib/fetch.js
// Build-safe, cross-site CSRF helper for Vite (Vercel ↔ Render)

let _csrfToken = null;
let _csrfPromise = null;

// Use Vite env at build time; provide sane default for dev
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://cyphire.onrender.com"; // change to http://localhost:5000 for local if you prefer

function originOf(u) {
  try { return new URL(u).origin; } catch { return ""; }
}

const backendOrigin = originOf(API_BASE);

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
    .finally(() => {
      _csrfPromise = null;
    });

  return _csrfPromise;
}

// Unified fetch that auto-adds CSRF for unsafe methods to your backend
export async function apiFetch(input, options = {}) {
  const method = String(options.method || "GET").toUpperCase();

  // Normalize to absolute URL for origin check
  let url = typeof input === "string" ? input : (input && input.url) ? input.url : String(input);
  try { url = new URL(url, window.location.href).href; } catch {}

  const targetOrigin = originOf(url);
  const isBackend = targetOrigin === backendOrigin;
  const isUnsafe = /^(POST|PUT|PATCH|DELETE)$/.test(method);

  const headers = new Headers(options.headers || {});
  const final = { ...options, headers };

  if (isBackend) {
    // ensure cookies flow cross-site
    final.credentials = "include";

    // add CSRF header for unsafe methods (double-submit pattern)
    if (isUnsafe) {
      const token = await getCsrfToken();
      if (token) headers.set("X-CSRF-Token", token);
    }
  }

  // IMPORTANT: if body is FormData, don't set Content-Type manually
  return fetch(url, final);
}
