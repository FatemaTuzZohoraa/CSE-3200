import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { X, Building2, Users, Mail, Calendar, ShieldCheck, Ticket, Lock, Globe, MapPin } from "lucide-react";

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

const MY_STATUS_LABEL = {
  registered: 'You are registered',
  attended: 'You attended',
  pending_payment: 'Payment pending',
};

/**
 * ClubDetailsModal
 * Shows one approved club. Details come from GET /api/clubs/:id, which the
 * backend limits to approved clubs, so this page cannot show a pending club.
 *
 * Two tabs: About (the original content) and Events. The Events tab reuses the
 * event list already loaded into AppContext, so no extra request is needed.
 * Clicking "View details" opens the same event window used on the Events page.
 */
export const ClubDetailsModal = ({ clubId, onClose }) => {
  const { events, eventsLoading, setSelectedEvent, setIsRegisterModalOpen } = useApp();
  const { user } = useAuth();

  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("about");

  useEffect(() => {
    if (!clubId) return;

    setTab("about");

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

  // Upcoming first (soonest first), then past events (newest first)
  const clubEvents = events.filter((e) => String(e.clubId) === String(clubId));
  const sortedEvents = [
    ...clubEvents.filter((e) => e.status === 'Upcoming'),
    ...clubEvents.filter((e) => e.status !== 'Upcoming').reverse(),
  ];

  const openEvent = (event) => {
    setSelectedEvent(event);
    setIsRegisterModalOpen(true);
  };

  const tabClass = (key) =>
    `px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
      tab === key ? 'border-amber-700 text-amber-900' : 'border-transparent text-stone-500 hover:text-stone-800'
    }`;

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

        {club && (
          <div className="flex px-4 border-b border-amber-200/60 bg-amber-50/50 shrink-0">
            <button onClick={() => setTab('about')} className={tabClass('about')}>About</button>
            <button onClick={() => setTab('events')} className={tabClass('events')}>
              Events{user && !eventsLoading ? ` (${clubEvents.length})` : ''}
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-700">
          {isLoading && <p className="text-center text-stone-500 py-8">Loading club...</p>}

          {error && <p className="text-center text-orange-700 py-8">{error}</p>}

          {club && tab === 'about' && (
            <div className="space-y-6">

              {/* Logo + Name */}
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-amber-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {club.logo_url ? (
                    <img src={resolveAssetUrl(club.logo_url)} alt={club.name} className="w-full h-full object-contain p-1.5" />
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

          {club && tab === 'events' && (
            <div className="space-y-3">
              {!user ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-stone-600">Log in with your RUET account to see this club's events.</p>
                  <Link to="/login" className="inline-block px-4 py-2 rounded-xl bg-fall-600 text-white text-xs font-bold">
                    Log In
                  </Link>
                </div>
              ) : eventsLoading ? (
                <p className="text-center text-stone-500 py-8">Loading events...</p>
              ) : sortedEvents.length === 0 ? (
                <p className="text-center text-stone-500 py-8">{club.name} has no events right now.</p>
              ) : (
                sortedEvents.map((evt) => (
                  <div key={evt.id} className="glass-panel rounded-xl border-amber-200/60 bg-white/80 p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-stone-900 font-serif">{evt.title}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${evt.isPaid ? 'bg-orange-800 text-white' : 'bg-amber-800 text-white'}`}>
                        {evt.isPaid ? `${evt.fee} BDT` : 'FREE'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" /> {evt.date} • {evt.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-700" /> {evt.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        {evt.audience === 'members_only' ? (
                          <><Lock className="w-3.5 h-3.5 text-amber-700" /> Members only</>
                        ) : (
                          <><Globe className="w-3.5 h-3.5 text-amber-700" /> Open to all RUET</>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-bold text-amber-900">
                        {MY_STATUS_LABEL[evt.myStatus] || (evt.status === 'Past' ? 'Event ended' : '')}
                      </span>
                      <button
                        onClick={() => openEvent(evt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white transition-all"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>View details</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};