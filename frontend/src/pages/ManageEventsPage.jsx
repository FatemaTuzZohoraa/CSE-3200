import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { EditEventModal } from "../components/EditEventModal";
import {
  CalendarPlus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  Lock,
  Globe,
  Pencil,
  Ban,
  ClipboardList
} from "lucide-react";

const fmt = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const stateOf = (e) => {
  if (e.status === "cancelled") return "Cancelled";
  if (new Date(e.end_at) < new Date()) return "Past";
  return "Upcoming";
};

const STATE_STYLE = {
  Upcoming: "bg-amber-100 text-amber-900 border-amber-300",
  Past: "bg-stone-200 text-stone-600 border-stone-300",
  Cancelled: "bg-orange-100 text-orange-900 border-orange-300"
};

/**
 * ManageEventsPage  ->  route: /manage-events
 * Every event of the clubs the logged-in student currently leads (any status).
 * The backend (GET /api/events/managed) decides which events appear, and every
 * edit / cancel is checked again on the server.
 */
export const ManageEventsPage = () => {
  const { setIsCreateEventModalOpen, isCreateEventModalOpen, reloadEvents } = useApp();

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/events/managed");
      setEvents(data.events || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Runs on page load, and again each time the "Create Event" modal closes
  useEffect(() => {
    if (!isCreateEventModalOpen) load();
  }, [isCreateEventModalOpen, load]);

  const cancelEvent = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"? Students will no longer see it. You must refund any confirmed payments yourself.`)) {
      return;
    }

    setBusyId(event.id);
    setError("");
    setNotice("");

    try {
      const data = await apiFetch(`/api/events/${event.id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      setNotice(data.message);
      await load();
      await reloadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = async (message) => {
    setEditing(null);
    setNotice(message);
    await load();
    await reloadEvents();
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <Calendar className="w-5 h-5 text-amber-700" />
            <span>Manage Events</span>
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Events of the clubs you lead. Open an event to see who registered and to check payments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateEventModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white shadow-md transition-all"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Create event</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start space-x-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
          <span>{notice}</span>
        </div>
      )}

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm space-y-2">
          <p>No events yet. Only the president of an approved club can create events.</p>
          <p>
            Not a president yet?{" "}
            <Link to="/my-submissions" className="font-bold text-amber-800 hover:underline">
              Check your club submissions
            </Link>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => {
          const state = stateOf(event);
          const isOpen = state === "Upcoming";
          const poster = resolveAssetUrl(event.image_url);

          return (
            <div key={event.id} className="glass-panel rounded-2xl border-stone-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-36 h-28 rounded-xl bg-amber-50/60 border border-amber-200 overflow-hidden shrink-0 flex items-center justify-center">
                {poster ? (
                  <img src={poster} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-7 h-7 text-stone-300" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-sm font-serif truncate">{event.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${STATE_STYLE[state]}`}>
                    {state}
                  </span>
                  {event.pending_payments > 0 && (
                    <span className="px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider bg-orange-600 text-white border-orange-700">
                      {event.pending_payments} payment{event.pending_payments > 1 ? "s" : ""} to check
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-500">
                  {event.organizer?.name} • {fmt(event.start_at)} • {event.venue}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-700">
                  <span className="font-bold">{event.is_paid ? `${event.fee} BDT` : "Free"}</span>
                  <span className="flex items-center gap-1">
                    {event.audience === "members_only" ? (
                      <><Lock className="w-3 h-3 text-amber-700" /> Members only</>
                    ) : (
                      <><Globe className="w-3 h-3 text-amber-700" /> All RUET students</>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-700" />
                    {event.registered_count}
                    {event.capacity ? ` / ${event.capacity}` : ""} registered
                  </span>
                  <span>Register by {fmt(event.registration_deadline)}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    to={`/manage-events/${event.id}/registrations`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white transition-all"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Registrations</span>
                  </Link>

                  {isOpen && (
                    <>
                      <button
                        onClick={() => setEditing(event)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-700 border border-amber-200 hover:bg-amber-50 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => cancelEvent(event)}
                        disabled={busyId === event.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100 transition-all disabled:opacity-60"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{busyId === event.id ? "Cancelling..." : "Cancel event"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && <EditEventModal event={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </main>
  );
};