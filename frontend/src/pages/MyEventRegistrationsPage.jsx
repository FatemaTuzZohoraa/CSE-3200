import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useApp } from "../context/AppContext";
import { StatusBadge, PAYMENT_LABELS } from "../components/StatusBadge";
import { Ticket, AlertCircle, RefreshCw, MapPin, Calendar } from "lucide-react";

const fmt = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

// What the student sees as the main badge
const badgeFor = (r) => {
  if (r.event_status === "cancelled") return { status: "cancelled", label: "Event cancelled" };
  if (r.status === "registered") return { status: "approved", label: "Registered" };
  if (r.status === "attended") return { status: "approved", label: "Attended" };
  if (r.status === "cancelled") return { status: "cancelled", label: "Registration cancelled" };
  // pending_payment
  return r.payment_status === "failed"
    ? { status: "rejected", label: "Payment rejected" }
    : { status: "pending", label: "Waiting for payment check" };
};

/**
 * MyEventRegistrationsPage  ->  route: /my-event-registrations
 * The student's own registrations (GET /api/events/my/registrations).
 * "View details" reopens the same event window used on the Events page, where
 * they can cancel or send new payment details after a rejection.
 */
export const MyEventRegistrationsPage = () => {
  const { events, setSelectedEvent, setIsRegisterModalOpen, isRegisterModalOpen } = useApp();

  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/events/my/registrations");
      setRegistrations(data.registrations);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On page load, and again whenever the event window closes (the student may have cancelled or paid)
  useEffect(() => {
    if (!isRegisterModalOpen) load();
  }, [isRegisterModalOpen, load]);

  const openDetails = (eventId) => {
    const uiEvent = events.find((e) => String(e.id) === String(eventId));
    if (!uiEvent) return;
    setSelectedEvent(uiEvent);
    setIsRegisterModalOpen(true);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <Ticket className="w-5 h-5 text-amber-700" />
            <span>My Event Registrations</span>
          </h1>
          <p className="text-xs text-stone-600 mt-1">Events you registered for and the status of your payments.</p>
        </div>

        <button
          onClick={load}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-stone-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Refresh</span>
        </button>
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

      {!isLoading && !error && registrations.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm space-y-2">
          <p>You have not registered for any event yet.</p>
          <Link to="/events" className="font-bold text-amber-800 hover:underline">
            Browse upcoming events
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {registrations.map((r) => {
          const badge = badgeFor(r);
          const canOpen = r.event_status !== "cancelled" && events.some((e) => String(e.id) === String(r.event_id));

          return (
            <div key={r.id} className="glass-panel rounded-2xl border-stone-200 bg-white p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-stone-900 text-sm font-serif">{r.title}</h3>
                  <p className="text-[11px] text-stone-500">{r.club_name}</p>
                </div>
                <StatusBadge status={badge.status} label={badge.label} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-700">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  {fmt(r.start_at)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-700" />
                  {r.venue}
                </span>
                <span className="font-bold">{r.fee > 0 ? `${r.fee} BDT` : "Free"}</span>
              </div>

              {/* Payment details exist only for paid events */}
              {r.payment_method && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-stone-800">
                      {r.payment_method === "bkash" ? "bKash" : "Cash"} • ৳{Number(r.payment_amount)}
                    </span>
                    <StatusBadge status={r.payment_status} label={PAYMENT_LABELS[r.payment_status]} />
                  </div>
                  {r.transaction_id && (
                    <p className="text-stone-600">
                      TrxID: <span className="font-mono tracking-wider">{r.transaction_id}</span>
                    </p>
                  )}
                  {r.payment_status === "failed" && r.review_note && (
                    <p className="text-orange-900">Reason: {r.review_note}</p>
                  )}
                </div>
              )}

              {r.status === "pending_payment" && r.payment_status === "failed" && r.event_status !== "cancelled" && (
                <p className="text-[11px] text-orange-900">
                  Open the event and send new payment details to keep your seat.
                </p>
              )}

              {canOpen && (
                <button
                  onClick={() => openDetails(r.event_id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-amber-300 hover:bg-amber-50 transition-all"
                >
                  View details
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
};