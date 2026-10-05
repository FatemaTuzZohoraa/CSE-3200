import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { X, Building2, Users, Mail, Calendar, ShieldCheck } from "lucide-react";

const categoryStyles = {
  Technology: 'badge-tech text-white',
  Robotics: 'badge-robotics text-white',
  Career: 'badge-career text-white',
  Cultural: 'badge-cultural text-white',
  Sports: 'badge-sports text-white',
  Science: 'bg-amber-800 text-white',
  Academic: 'bg-orange-800 text-white',
  Social: 'bg-amber-700 text-white',
};

/**
 * ClubDetailsModal
 * Shows one approved club. Details come from GET /api/clubs/:id, which the
 * backend limits to approved clubs, so this page cannot show a pending club.
 */
export const ClubDetailsModal = ({ clubId, onClose }) => {
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clubId) return;

    const loadClub = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await apiFetch(`/api/clubs/${clubId}`);
        setClub(data.club);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadClub();
  }, [clubId]);

  if (!clubId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">

        <div className="p-5 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-stone-900">Club Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-amber-200/60 text-stone-700 hover:bg-amber-300/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-700">
          {isLoading && <p className="text-center text-stone-500 py-8">Loading club...</p>}

          {error && <p className="text-center text-orange-700 py-8">{error}</p>}

          {club && (
            <div className="space-y-6">

              {/* Logo + Name */}
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-amber-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-8 h-8 text-stone-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-stone-900 font-sans">{club.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${categoryStyles[club.category] || 'bg-amber-800 text-white'
                      }`}>
                      {club.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      {club.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-1.5 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      <strong>{club.members_count}</strong> Members
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-700" />
                      Added {new Date(club.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* About */}
              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-2 font-sans">About this club</h4>
                <p className="text-stone-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line">{club.description}</p>
              </div>

              {/* Advisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="glass-panel p-4 rounded-xl border-amber-200/60 bg-white/70">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Faculty Advisor
                  </h4>
                  <p className="text-sm font-semibold text-stone-900">{club.advisor_name}</p>
                  {club.advisor_department && (
                    <p className="text-[11px] text-stone-500 mt-0.5">{club.advisor_department}</p>
                  )}
                </div>

                <div className="glass-panel p-4 rounded-xl border-amber-200/60 bg-white/70">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Advisor Contact</h4>
                  {club.advisor_email ? (
                    <a
                      href={`mailto:${club.advisor_email}`}
                      className="flex items-center space-x-2 text-amber-800 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{club.advisor_email}</span>
                    </a>
                  ) : (
                    <p className="text-stone-400 text-[11px]">No advisor email provided.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};