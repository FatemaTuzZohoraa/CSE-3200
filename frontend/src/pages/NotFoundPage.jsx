import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

/**
 * NotFoundPage
 *
 * Keeps the navbar above it, so the visitor can click back into the site
 * instead of hitting a dead end.
 */
export const NotFoundPage = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="glass-panel rounded-3xl border-slate-200 bg-white p-12 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center">
          <Compass className="w-8 h-8 text-pink-600" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        That link does not point anywhere in Ruet Club Zone.
      </p>

      <Link
        to="/"
        className="inline-block mt-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
      >
        Back to Home
      </Link>
    </div>
  </main>
);