import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, setToken, clearToken, getToken } from "../lib/api";

/**
 * AuthContext holds the real logged-in user from the backend.
 *
 * This replaces the old "switch demo role" dropdown for everything club related.
 * The demo role still exists in AppContext for the other mock screens
 * (events, achievements), but club pages read the user from here so they match
 * what the backend actually knows.
 *
 * NOTE ON SECURITY: the user object saved here is only used to decide which
 * buttons to draw. Every club API call is authorised again on the server, so
 * editing this in the browser would gain nothing.
 */

const USER_KEY = "clubhub_user";

const AuthContext = createContext();

const readSavedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readSavedUser);
  const [isChecking, setIsChecking] = useState(true);

  // On page load, confirm the saved token is still accepted by the backend.
  useEffect(() => {
    const checkExistingLogin = async () => {
      if (!getToken()) {
        setIsChecking(false);
        return;
      }

      try {
        // Any authenticated call proves the token still works.
        await apiFetch("/api/clubs/mine");
      } catch {
        // Expired or rejected token, so drop it and show the logged out view.
        clearToken();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingLogin();
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  /**
   * register(name, email, password)
   *
   * Calls POST /api/auth/register. The backend always forces role = 'student',
   * so an admin cannot be created from this form.
   *
   * No token is stored here. The account has to be verified and then go through
   * the login page, which matches the flow the backend was built for.
   */
  const register = async (name, email, password) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    return data;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isChecking, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);