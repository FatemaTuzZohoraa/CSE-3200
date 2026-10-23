import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, downloadFile } from "../lib/api";
import { StatusBadge, PAYMENT_LABELS } from "../components/StatusBadge";
import { AlertCircle, ArrowLeft, Copy, Download, Users } from "lucide-react";

const inputClass =
  "w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-amber-800/30 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all";

const fmt = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const TABS = [
  { key: "pending_payment", label: "Needs payment check" },
  { key: "registered", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" }
];

const REG_BADGE = {
  registered: { status: "approved", label: "Registered" },
  attended: { status: "approved", label: "Attended" },
  pending_payment: { status: "pending", label: "Awaiting payment" },
  cancelled: { status: "cancelled", label: "Cancelled" }
};

/**
 * One registration. For a paid event with a payment waiting, the president must
 * tick "I verified this payment" before Approve unlocks. They compare the amount
 * and TrxID shown here with their own bKash app (or confirm they got the cash).
 * A TrxID typed by a student is only a claim, never proof. The backend enforces
 * the confirmation too.
 */
const RegistrationCard = ({ reg, eventId, onChanged }) => {
  const [verified, setVerified] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const badge = REG_BADGE[reg.status] || REG_BADGE.cancelled;
  const roll = reg.email.split("@")[0];
  const hasPayment = Boolean(reg.payment_method);
  const needsCheck = reg.status === "pending_payment" && reg.payment_status === "pending";

  const copyTrx = async () => {
    try {
      await navigator.clipboard.writeText(reg.transaction_id);
    } catch {
      // copying is a convenience only
    }
  };

  const decide = async (action, body) => {
    setBusy(true);
    setError("");

    try {
      await apiFetch(`/api/events/${eventId}/registrations/${reg.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(body)
      });
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border-stone-200 bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-stone-900 text-sm font-serif">{reg.name}</h3>
          <p className="text-[11px] text-stone-500">Roll {roll} • {reg.email}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Registered {fmt(reg.registered_at)}</p>
        </div>
        <StatusBadge status={badge.status} label={badge.label} />
      </div>

      {hasPayment && (
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-800">
              {reg.payment_method === "bkash" ? "bKash" : "Cash"} • expected ৳{Number(reg.payment_amount)}
            </span>
            <StatusBadge status={reg.payment_status} label={PAYMENT_LABELS[reg.payment_status]} />
          </div>

          {reg.transaction_id && (
            <div className="flex items-center gap-2">
              <span className="text-stone-500">TrxID:</span>
              <span className="font-mono text-[12px] tracking-wider text-stone-800">{reg.transaction_id}</span>
              <button
                type="button"
                onClick={copyTrx}
                className="p-1 rounded-md text-stone-500 hover:bg-amber-100"
                title="Copy transaction ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {needsCheck && (
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {reg.payment_method === "bkash"
                ? `Open your bKash app and check that this transaction exists and the amount is ৳${Number(reg.payment_amount)}.`
                : "Collect the cash from the student in person before approving."}
            </p>
          )}

          {reg.status === "pending_payment" && reg.payment_status === "failed" && (
            <p className="text-[11px] text-orange-900 leading-relaxed">
              You rejected this payment{reg.review_note ? `: "${reg.review_note}"` : ""}. Waiting for the student to
              send new payment details.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-2.5 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{error}</span>
        </div>
      )}

      {needsCheck && (
        <div className="space-y-3 pt-1 border-t border-amber-100">
          <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I verified this payment{" "}
              {reg.payment_method === "bkash"
                ? "(transaction ID and amount checked in my bKash app)"
                : "(I received the cash)"}
              .
            </span>
          </label>

          {!showReject ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => decide("approve-payment", { payment_verified: true })}
                disabled={busy || !verified}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Working..." : "Confirm payment"}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 transition-all disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (the student will read this and can send new details)"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => decide("reject-payment", { comment: rejectReason })}
                  disabled={busy || !rejectReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-700 hover:bg-orange-800 text-white transition-all disabled:opacity-50"
                >
                  {busy ? "Working..." : "Confirm rejection"}
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-stone-700 border border-amber-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * EventRegistrationsPage  ->  route: /manage-events/:id/registrations
 * Who registered for one event, payment checks, and the PDF / CSV export.
 * Only the president of the hosting club gets data; the backend answers 403 to anyone else.
 */
export const EventRegistrationsPage = () => {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [eventError, setEventError] = useState("");

  const [tab, setTab] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [includePending, setIncludePending] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const loadEvent = useCallback(async () => {
    try {
      const data = await apiFetch("/api/events/managed");
      const found = (data.events || []).find((e) => String(e.id) === String(id));

      if (!found) {
        setEventError("You can only view registrations of events hosted by a club you lead.");
        return;
      }

      setEvent(found);
      // First visit: paid events open on the payment queue, free events on the confirmed list
      setTab((current) => current ?? (found.is_paid ? "pending_payment" : "registered"));
    } catch (err) {
      setEventError(err.message);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const loadRows = useCallback(async () => {
    if (!tab) return;
    setIsLoading(true);
    setListError("");

    try {
      const data = await apiFetch(`/api/events/${id}/registrations?status=${tab}`);
      setRows(data.registrations);
    } catch (err) {
      setListError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, tab]);

  useEffect(() => {
    if (event) loadRows();
  }, [event?.id, loadRows]);

  const refreshAll = async () => {
    await loadEvent();
    await loadRows();
  };

  const download = async (format) => {
    setDownloading(format);
    setDownloadError("");

    try {
      await downloadFile(
        `/api/events/${id}/registrations/export?format=${format}${includePending ? "&include=all" : ""}`,
        `event-${id}-registrations.${format}`
      );
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading("");
    }
  };

  if (eventError) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{eventError}</span>
        </div>
        <Link to="/manage-events" className="inline-block text-xs font-bold text-amber-800 hover:underline">
          Back to Manage Events
        </Link>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      </main>
    );
  }

  const visibleTabs = TABS.filter((t) => event.is_paid || t.key !== "pending_payment");

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-2 border-b border-amber-200/60 pb-4">
        <Link
          to="/manage-events"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Manage Events
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 font-serif">{event.title}</h1>
        <p className="text-xs text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{event.organizer?.name}</span>
          <span>{fmt(event.start_at)}</span>
          <span>{event.venue}</span>
          <span className="font-bold">{event.is_paid ? `${event.fee} BDT` : "Free event: no payment needed"}</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-700" />
            {event.registered_count}
            {event.capacity ? ` / ${event.capacity}` : ""} registered
          </span>
          {event.status === "cancelled" && <span className="font-bold text-orange-800">Cancelled</span>}
        </p>
      </div>

      {/* Export */}
      <section className="glass-panel rounded-2xl border-stone-200 bg-white p-4 space-y-3">
        <h2 className="font-bold text-stone-900 text-sm font-serif">Download the list</h2>

        {event.is_paid && (
          <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(e) => setIncludePending(e.target.checked)}
              className="mt-0.5"
            />
            <span>Also include students whose payment is not confirmed yet</span>
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          {["pdf", "csv"].map((format) => (
            <button
              key={format}
              onClick={() => download(format)}
              disabled={Boolean(downloading)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 border border-amber-300 hover:bg-amber-50 transition-all disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>{downloading === format ? "Preparing..." : `Download ${format.toUpperCase()}`}</span>
            </button>
          ))}
        </div>

        {downloadError && <p className="text-xs text-orange-800">{downloadError}</p>}
      </section>

      {/* Tabs + list */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                tab === t.key
                  ? "bg-fall-600 text-white border-fall-600"
                  : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
              }`}
            >
              {t.label}
              {t.key === "pending_payment" && event.pending_payments > 0 && ` (${event.pending_payments})`}
            </button>
          ))}
        </div>

        {listError && (
          <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
            <span>{listError}</span>
          </div>
        )}

        {isLoading && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
        )}

        {!isLoading && !listError && rows.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
            Nobody in this list yet.
          </div>
        )}

        <div className="space-y-4">
          {rows.map((reg) => (
            <RegistrationCard key={reg.id} reg={reg} eventId={id} onChanged={refreshAll} />
          ))}
        </div>
      </section>
    </main>
  );
};