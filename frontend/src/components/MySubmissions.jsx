import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Building2, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

/**
 * Maps a status string to its badge styling. Keeps the colours consistent with
 * the rest of the app (emerald for approved, amber for pending, rose for rejected).
 */
const statusStyles = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  suspended: 'bg-slate-200 text-slate-700 border-slate-300'
};

const statusIcons = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  suspended: XCircle
};

/**
 * MySubmissions
 * Lists the clubs the logged-in student submitted, with their current status.
 *
 * The list always comes from GET /api/clubs/mine, and that route reads the user
 * id from the login token. There is no user id in the URL to change.
 */
export const MySubmissions = () => {
  const { user } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/clubs/mine");
      setClubs(data.clubs);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-pink-600" />
            <span>My Club Submissions</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Clubs you submitted and their current review status.
            {user && <span className="ml-1 text-slate-400">Signed in as {user.email}</span>}
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">Loading your submissions...</div>
      )}

      {error && (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-sm text-rose-600">{error}</p>
          <button onClick={loadSubmissions} className="mt-3 text-xs font-semibold text-pink-600 hover:underline">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && clubs.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
          You have not submitted any clubs yet. Use the Create Club button to submit one for review.
        </div>
      )}

      {!isLoading && !error && clubs.length > 0 && (
        <div className="space-y-3">
          {clubs.map((club) => {
            const StatusIcon = statusIcons[club.status] || Clock;

            return (
              <div key={club.id} className="glass-panel p-5 rounded-2xl border-slate-200 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{club.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {club.category} • Submitted {new Date(club.created_at).toLocaleDateString()}
                        {club.is_president && <span className="text-pink-600 font-semibold"> • You are the president</span>}
                      </p>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{club.description}</p>
                    </div>
                  </div>

                  <span className={`self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1 ${
                    statusStyles[club.status] || statusStyles.pending
                  }`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {club.status}
                  </span>
                </div>

                {/* The admin's reason, stored in club_status_history */}
                {club.status === 'rejected' && club.rejection_reason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    <strong>Rejection reason:</strong> {club.rejection_reason}
                  </div>
                )}

                {club.status === 'pending' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Waiting for DSW / admin review. Your club is not publicly visible yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};