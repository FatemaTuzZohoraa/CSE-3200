import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { X, Building2, Users, Mail, Calendar, ShieldCheck } from "lucide-react";

const categoryStyles = {
  Technology: 'badge-tech text-white',
  Robotics: 'badge-robotics text-white',
  Career: 'badge-career text-white',
  Cultural: 'badge-cultural text-white',
  Sports: 'badge-sports text-white',
  Science: 'bg-indigo-600 text-white',
  Academic: 'bg-emerald-600 text-white',
  Social: 'bg-rose-500 text-white',
};

/**
 * ClubDetailModal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">

        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-pink-600" />
            <h3 className="text-base font-bold text-slate-900">Club Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700">
          {isLoading && <p className="text-center text-slate-500 py-8">Loading club...</p>}

          {error && <p className="text-center text-rose-600 py-8">{error}</p>}

          {club && (
            <div className="space-y-6">

              {/* Logo + Name */}
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900">{club.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      categoryStyles[club.category] || 'bg-slate-700 text-white'
                    }`}>
                      {club.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {club.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-pink-600" />
                      <strong>{club.members_count}</strong> Members
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      Added {new Date(club.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* About */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">About this club</h4>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm whitespace-pre-line">{club.description}</p>
              </div>

              {/* Advisor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="glass-panel p-4 rounded-xl border-slate-200 bg-slate-50">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Faculty Advisor
                  </h4>
                  <p className="text-sm font-semibold text-slate-900">{club.advisor_name}</p>
                  {club.advisor_department && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{club.advisor_department}</p>
                  )}
                </div>

                <div className="glass-panel p-4 rounded-xl border-slate-200 bg-slate-50">
                  <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">Advisor Contact</h4>
                  {club.advisor_email ? (
                    <a
                      href={`mailto:${club.advisor_email}`}
                      className="flex items-center space-x-2 text-cyan-700 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{club.advisor_email}</span>
                    </a>
                  ) : (
                    <p className="text-slate-400 text-[11px]">No advisor email provided.</p>
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