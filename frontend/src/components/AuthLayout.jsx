import React from "react";
import { Link } from "react-router-dom";

/**
 * AuthLayout
 * Two column shell shared by Login and Signup pages styled with Fall aesthetic.
 */
export const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-[#FAF5EF] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-amber-200/80 rounded-3xl shadow-2xl overflow-hidden">

        {/* Branded side */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-amber-700 via-orange-800 to-amber-950 text-white">
          <Link to="/" className="flex items-center space-x-3 self-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 p-1 shadow-md border border-amber-300">
              <img src="/ruet-logo.png" alt="RUET Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-logo font-bold text-xl text-amber-100 tracking-wider">Ruet Club Zone</span>
          </Link>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold leading-tight font-serif text-amber-100">
              One account for every club on campus.
            </h2>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              Join existing societies, submit a new club for DSW review, and keep track of
              every decision in one place.
            </p>

            <ul className="space-y-2 text-sm text-amber-100/90">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                Register with your RUET EduMail
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                Become the first president of a new club
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                Track your submissions through admin review
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-amber-300/70 font-logo">
            Rajshahi University of Engineering &amp; Technology
          </p>
        </div>

        {/* Form side */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-[#FAF5EF]/50">
          <Link to="/" className="lg:hidden flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 p-1 border border-amber-300">
              <img src="/ruet-logo.png" alt="RUET Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-logo font-bold text-lg bg-gradient-to-r from-amber-700 via-orange-600 to-amber-900 bg-clip-text text-transparent">
              Ruet Club Zone
            </span>
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-stone-900 font-serif">{title}</h1>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-6 text-xs text-stone-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export const inputClass =
  "w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder-amber-800/30 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all";

export const AuthAlert = ({ tone = "error", children }) => {
  if (!children) return null;

  const toneClass =
    tone === "success"
      ? "bg-amber-100/70 border-amber-300 text-amber-950"
      : "bg-orange-100/70 border-orange-300 text-orange-950";

  return (
    <div className={`flex items-start space-x-2 p-3 border rounded-xl text-xs ${toneClass}`}>
      <span>{children}</span>
    </div>
  );
};

export const AuthSubmitButton = ({ isSubmitting, children }) => (
  <button
    type="submit"
    disabled={isSubmitting}
    className="w-full py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
  >
    {isSubmitting ? "Please wait..." : children}
  </button>
);