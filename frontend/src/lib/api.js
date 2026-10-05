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
 * apiFetch(path, options)
 *
 * - Attaches the saved JWT as an "Authorization: Bearer <token>" header.
 * - Throws an Error carrying the server's message, so callers can just try/catch.
 * - A 401 means the token is gone or expired, so we clear it and let the UI
 *   fall back to the logged out view.
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
};