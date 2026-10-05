import React from "react";
import { AdminClubReview } from "../components/AdminClubReview";
import { useAuth } from "../context/AuthContext";

/**
 * AdminReviewPage  ->  route: /admin/review
 *
 * Protected page. Only admins get here (see AdminRoute), and the backend also
 * rejects non-admin tokens on every /api/admin/clubs request, so opening this
 * URL by hand gains nothing.
 */
export const AdminReviewPage = () => {
  const { user } = useAuth();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminClubReview />

      <p className="mt-4 text-[11px] text-slate-500">
        Signed in as <strong className="text-slate-700">{user?.name}</strong> ({user?.email}).
        Clubs you approve become visible on the public Clubs page immediately.
      </p>
    </main>
  );
};