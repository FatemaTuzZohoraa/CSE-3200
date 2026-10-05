import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * A small "checking your saved session" screen.
 *
 * AuthContext calls /api/clubs/mine on page load to confirm the token is still
 * good. Redirecting before that finishes would bounce a logged-in user to
 * /login for a split second on every refresh, so we wait here instead.
 */
const SessionChecking = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
    <p className="text-xs text-slate-500">Checking your session...</p>
  </div>
);

/**
 * ProtectedRoute
 *
 * Sends logged-out visitors to /login and remembers where they were heading, so
 * the LoginPage can return them there after a successful login.
 *
 * This is only a UI gate. The real protection is on the server: every private
 * route under /api checks the JWT again.
 */
export const ProtectedRoute = ({ children }) => {
  const { user, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) return <SessionChecking />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

/**
 * AdminRoute
 *
 * Same as ProtectedRoute, but also requires role === 'admin'. The backend's
 * requireAdmin middleware is the real gate; this just avoids showing an admin
 * screen to a student who would only get 403s.
 */
export const AdminRoute = ({ children }) => {
  const { user, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) return <SessionChecking />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};