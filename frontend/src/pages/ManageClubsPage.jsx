import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, downloadFile, resolveAssetUrl } from "../lib/api";
import { Crown, Building2, Users, AlertCircle, Calendar, Download } from "lucide-react";

/**
 * ManageClubsPage  ->  route: /manage-clubs
 * Approved clubs where the logged-in student is the current president.
 * From here a leader opens the applications queue and fee settings, the event
 * manager, and downloads the current member list (PDF or CSV).
 */
export const ManageClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(""); // e.g. "3-pdf"

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch("/api/clubs/mine");
        setClubs(data.clubs.filter((club) => club.is_president && club.status === "approved"));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const downloadMembers = async (club, format) => {
    setDownloading(`${club.id}-${format}`);
    setError("");

    try {
      await downloadFile(`/api/clubs/${club.id}/members/export?format=${format}`, `club-${club.id}-members.${format}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading("");
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-amber-200/60 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
          <Crown className="w-5 h-5 text-amber-700" />
          <span>Manage My Clubs</span>
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Clubs you lead. Review membership applications, set the membership fee, run events and download member lists.
        </p>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      )}

      {!isLoading && !error && clubs.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm space-y-2">
          <p>You are not the president of any approved club yet.</p>
          <Link to="/my-submissions" className="font-bold text-amber-800 hover:underline">
            Check the status of your club submissions
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {clubs.map((club) => (
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
                <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-700" />
                  {club.category}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to={`/clubs/${club.id}/applications`}
                className="block w-full py-2 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white shadow-md transition-all"
              >
                Applications & fee settings
              </Link>

              <Link
                to="/manage-events"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-center bg-white text-stone-800 border border-amber-300 hover:bg-amber-50 transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Events & registrations</span>
              </Link>

              <div className="flex gap-2">
                {["pdf", "csv"].map((format) => (
                  <button
                    key={format}
                    onClick={() => downloadMembers(club, format)}
                    disabled={Boolean(downloading)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-white text-stone-700 border border-amber-200 hover:bg-amber-50 transition-all disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {downloading === `${club.id}-${format}` ? "Preparing..." : `Members ${format.toUpperCase()}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};