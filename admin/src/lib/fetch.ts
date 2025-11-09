// src/lib/fetch.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const csrf = document.cookie.match(/(?:^|;)\s*csrfToken=([^;]+)/)?.[1];
  const method = (options.method || "GET").toUpperCase();
  const isUnsafe = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  const headers = new Headers(options.headers || {});
  if (csrf && isUnsafe) headers.set("X-CSRF-Token", decodeURIComponent(csrf));

  const init: RequestInit = { credentials: "include", ...options, headers };
  return fetch(url, init);
}
