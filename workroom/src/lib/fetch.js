// src/lib/fetch.js
export async function apiFetch(url, options = {}) {
  const csrf = document.cookie.match(/(?:^|;)\s*csrfToken=([^;]+)/)?.[1];
  const isUnsafe = /POST|PUT|PATCH|DELETE/i.test(options.method || "GET");
  const headers = new Headers(options.headers || {});
  if (csrf && isUnsafe) headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  return fetch(url, { credentials: "include", ...options, headers });
}
