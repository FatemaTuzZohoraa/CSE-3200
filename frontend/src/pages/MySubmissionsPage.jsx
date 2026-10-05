import React from "react";
import { Link } from "react-router-dom";
import { MySubmissions } from "../components/MySubmissions";
import { useAuth } from "../context/AuthContext";
import { PlusCircle } from "lucide-react";

/**
 * MySubmissionsPage  ->  route: /my-submissions
 *
 * Protected page. It lists the clubs the logged-in student submitted and where
 * each one sits in the review flow, which is what the create-club form redirects
 * to after a successful POST.
 */
export const MySubmissionsPage = () => {
  const { user } = useAuth();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <MySubmissions />

      <div className="flex justify-end">
        <Link
          to="/create-club"
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit another club</span>
        </Link>
      </div>

      {user?.role === "admin" && (
        <p className="text-[11px] text-slate-500 text-right">
          You are signed in as an admin. This page still lists clubs where you are a member.
        </p>
      )}
    </main>
  );
};