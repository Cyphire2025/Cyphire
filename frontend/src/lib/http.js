// src/lib/http.js
import axios from "axios";

axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const m = document.cookie.match(/(?:^|;)\s*csrfToken=([^;]+)/);
  const csrf = m ? decodeURIComponent(m[1]) : null;
  const method = (config.method || "get").toUpperCase();
  if (csrf && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

export default axios;
