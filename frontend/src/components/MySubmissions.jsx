import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Building2, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const statusStyles = {
  approved: 'bg-amber-100 text-amber-900 border-amber-300',
  pending: 'bg-orange-100 text-orange-900 border-orange-300',
  rejected: 'bg-amber-900 text-white border-amber-950',
  suspended: 'bg-stone-200 text-stone-700 border-stone-300'
};

const statusIcons = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  suspended: XCircle
};

/**
 * MySubmissions
 * Lists the clubs the logged-in student submitted, with their current status in Fall Vibe style.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <Building2 className="w-5 h-5 text-amber-700" />
            <span>My Club Submissions</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Clubs you submitted and their current review status.
            {user && <span className="ml-1 text-stone-400">Signed in as {user.email}</span>}
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-stone-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading your submissions...</div>
      )}

      {error && (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-sm text-orange-700">{error}</p>
          <button onClick={loadSubmissions} className="mt-3 text-xs font-semibold text-amber-700 hover:underline">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && clubs.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
          You have not submitted any clubs yet. Use the Create Club button to submit one for review.
        </div>
      )}

      {!isLoading && !error && clubs.length > 0 && (
        <div className="space-y-3">
          {clubs.map((club) => {
            const StatusIcon = statusIcons[club.status] || Clock;

            return (
              <div key={club.id} className="glass-panel p-5 rounded-2xl border-stone-200 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-5 h-5 text-stone-300" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-sm font-serif">{club.name}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {club.category} • Submitted {new Date(club.created_at).toLocaleDateString()}
                        {club.is_president && <span className="text-amber-800 font-semibold"> • You are the president</span>}
                      </p>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2">{club.description}</p>
                    </div>
                  </div>

                  <span className={`self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1 ${statusStyles[club.status] || statusStyles.pending
                    }`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {club.status}
                  </span>
                </div>

                {club.status === 'rejected' && club.rejection_reason && (
                  <div className="p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
                    <strong>Rejection reason:</strong> {club.rejection_reason}
                  </div>
                )}

                {club.status === 'pending' && (
                  <p className="text-[11px] text-amber-900 bg-amber-100/60 border border-amber-300 rounded-xl px-3 py-2">
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