// Small helper for calling the backend.
//
// Every club request the app makes goes through here, so the JWT lives in one
// place instead of being copy-pasted into each component.

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "clubhub_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * resolveAssetUrl(path)
 *
 * The database stores a logo as either
 *   "/uploads/logos/abc.png"      (saved on our backend: needs the backend address added)
 *   "https://res.cloudinary..."   (already a full URL: used as is)
 * Every <img> that shows a club logo should go through this, so moving to
 * Cloudinary later needs no frontend change. Returns null when there is no logo.
 */
export const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * toFormData(fields, fileField, file)
 *
 * Builds a multipart form from a plain object (empty values are skipped) and
 * attaches the file under the given field name.
 */
export const toFormData = (fields, fileField, file) => {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, value);
    }
  });

  if (file) form.append(fileField, file);

  return form;
};

/**
 * apiFetch(path, options)
 *
 * - Attaches the saved JWT as an "Authorization: Bearer <token>" header.
 * - Sends JSON by default. When the body is a FormData (a file upload), it does
 *   NOT set Content-Type, so the browser can add the multipart boundary itself.
 * - Throws an Error carrying the server's message, so callers can just try/catch.
 *   The error also has a .status (the HTTP code), so callers can tell a rejected
 *   token (401) from a server that is simply unreachable (no status at all).
 * - A 401 means the token is gone or expired, so we clear it and let the UI
 *   fall back to the logged out view.
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * downloadFile(path, fallbackName)
 * Fetches a protected file with the JWT, then saves it. A plain <a href> can't
 * send the Authorization header, so exports must go through here.
 */
export const downloadFile = async (path, fallbackName) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackName;
  a.click();
  URL.revokeObjectURL(url);
};