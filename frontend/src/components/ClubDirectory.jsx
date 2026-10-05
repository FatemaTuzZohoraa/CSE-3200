import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Building2, ExternalLink, Users } from "lucide-react";

/**
 * ClubDirectory
 * Public list of approved clubs, loaded from GET /api/clubs.
 *
 * The backend only ever returns status = 'approved' rows here, so pending,
 * rejected and suspended clubs cannot leak into this page.
 */
export const ClubDirectory = ({ onViewClub }) => {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadClubs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/clubs");
      setClubs(data.clubs);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  // Simple client-side name/description filter, matching the old mock search.
  const visibleClubs = clubs.filter((club) => {
    const matchesQuery =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-pink-600" />
            <span>Approved Clubs</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Clubs listed here have been reviewed and approved by the DSW office.
          </p>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clubs..."
          className="w-full sm:w-64 bg-purple-50/50 border border-purple-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-purple-300 focus:outline-none focus:bg-white focus:border-pink-500"
        />
      </div>

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">Loading clubs...</div>
      )}

      {error && (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-sm text-rose-600">{error}</p>
          <button onClick={loadClubs} className="mt-3 text-xs font-semibold text-pink-600 hover:underline">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && visibleClubs.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
          No approved clubs yet. Clubs appear here once an admin approves them.
        </div>
      )}

      {!isLoading && !error && visibleClubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleClubs.map((club) => (
            <div key={club.id} className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border-slate-200 flex flex-col group">
              <div className="relative h-36 overflow-hidden bg-slate-100 flex items-center justify-center">
                {club.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-300" />
                )}

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm">
                    {club.category}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{club.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-pink-600" />
                    <span><strong className="text-slate-800">{club.members_count}</strong> Members</span>
                  </span>

                  <button
                    onClick={() => onViewClub(club)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold border border-pink-200 transition-all"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};