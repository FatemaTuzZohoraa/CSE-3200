import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Building2, Users, LogOut, LogIn, RefreshCw, Clock, ShieldCheck,
  AlertCircle, CheckCircle2, ClipboardList
} from "lucide-react";

/**
 * MyClubsPage  ->  route: /my-clubs
 * Styled with Fall Vibe aesthetic.
 *
 * Joining is no longer instant: the bottom section links to the application
 * form, and shows "Application pending" for clubs the student already applied to.
 */
export const MyClubsPage = () => {
  const { user } = useAuth();

  const [myClubs, setMyClubs] = useState([]);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [pendingClubIds, setPendingClubIds] = useState(new Set());
  const [ownClubIds, setOwnClubIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyClubId, setBusyClubId] = useState(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [mineData, allData, applicationsData, submittedData] = await Promise.all([
        apiFetch("/api/clubs/joined"),
        apiFetch("/api/clubs"),
        apiFetch("/api/applications/mine"),
        apiFetch("/api/clubs/mine")
      ]);

      setMyClubs(mineData.clubs);
      setAvailableClubs(allData.clubs);

      // Clubs where an application is still waiting for the president
      setPendingClubIds(
        new Set(
          applicationsData.applications
            .filter((application) => application.status === "pending")
            .map((application) => String(application.club_id))
        )
      );

      // Clubs this student created and leads (they are members, but /joined skips them)
      setOwnClubIds(
        new Set(
          submittedData.clubs
            .filter((club) => club.status === "approved")
            .map((club) => String(club.id))
        )
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleLeave = async (club) => {
    setBusyClubId(club.id);
    setError("");
    setMessage("");

    try {
      const data = await apiFetch(`/api/clubs/${club.id}/leave`, { method: "POST" });
      await loadAll();
      setMessage(data.message);
    } catch (leaveError) {
      setError(leaveError.message);
    } finally {
      setBusyClubId(null);
    }
  };

  const joinedIds = new Set(myClubs.map((club) => String(club.id)));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
              <Building2 className="w-5 h-5 text-amber-700" />
              <span>My Club Memberships</span>
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              Clubs you are a member of.
              {user && <span className="ml-1 text-stone-400">{user.email}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/my-applications"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-stone-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
              <span>My Applications</span>
            </Link>

            <button
              onClick={loadAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-stone-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start space-x-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 text-xs">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
            <span>{message}</span>
          </div>
        )}

        {isLoading && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading your clubs...</div>
        )}

        {!isLoading && myClubs.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
            You have not joined any clubs yet. Apply to one from the list below.
          </div>
        )}

        {!isLoading && myClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myClubs.map((club) => (
              <div key={club.id} className="glass-panel rounded-2xl border-stone-200 bg-white p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                    {club.logo_url ? (
                      <img src={resolveAssetUrl(club.logo_url)} alt={club.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-5 h-5 text-stone-300" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-stone-900 text-sm truncate font-serif">{club.name}</h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {club.category} •{" "}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-700" />
                        {club.members_count} members
                      </span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Joined {new Date(club.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{club.description}</p>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-100">
                  <span className="text-[10px] text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    Advisor: {club.advisor_name}
                  </span>

                  <button
                    onClick={() => handleLeave(club)}
                    disabled={busyClubId === club.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 text-xs font-semibold border border-orange-200 rounded-xl transition-all disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{busyClubId === club.id ? "Leaving..." : "Leave"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="border-b border-amber-200/60 pb-4">
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <Building2 className="w-5 h-5 text-amber-700" />
            <span>Apply to a Club</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Approved clubs open for new members. Send an application and the club president will review it.
          </p>
        </div>

        {!isLoading && availableClubs.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
            No clubs are available right now.
          </div>
        )}

        {!isLoading && availableClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableClubs.map((club) => {
              const clubKey = String(club.id);
              const isMember = joinedIds.has(clubKey) || ownClubIds.has(clubKey);
              const isPending = pendingClubIds.has(clubKey);

              return (
                <div
                  key={club.id}
                  className="glass-panel rounded-2xl border-stone-200 bg-white p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                      {club.logo_url ? (
                        <img src={resolveAssetUrl(club.logo_url)} alt={club.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-5 h-5 text-stone-300" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate font-serif">{club.name}</h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {club.category} •{" "}
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-700" />
                          {club.members_count}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed flex-1">{club.description}</p>

                  {isMember ? (
                    <div className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-100/50 text-stone-400 border border-amber-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Already a member</span>
                    </div>
                  ) : isPending ? (
                    <Link
                      to="/my-applications"
                      className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Application pending</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/clubs/${club.id}/apply`}
                      className="w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white shadow-md"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Apply to Join</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};