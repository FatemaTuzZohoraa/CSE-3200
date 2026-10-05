import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, GraduationCap, AlertCircle } from "lucide-react";

/**
 * LoginModal
 * Sends credentials to the existing POST /api/auth/login endpoint.
 * We did not build a new auth flow, we just added a form for the one that exists.
 */
export const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      onClose();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">

        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-pink-600" />
            <h3 className="text-base font-bold text-slate-900">Student Login</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:text-slate-900">
            <span className="text-xs font-bold">X</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <p className="text-slate-500">
            Sign in with your RUET EduMail to create a club or track your submissions.
          </p>

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold mb-1 block">RUET EduMail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="2203032@student.ruet.ac.bd"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your account password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? "Logging in..." : "Log In"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};