import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { StatusBadge, PAYMENT_LABELS } from "../components/StatusBadge";
import { Crown, AlertCircle, CheckCircle2, Copy, Save } from "lucide-react";

const inputClass =
  "w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-amber-800/30 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" }
];

/**
 * One application with its review controls.
 * For a paid application the president must tick "I verified this payment"
 * before Approve unlocks: they check the transaction in their own bKash app, or
 * confirm they received the cash. The backend enforces this too.
 */
const ApplicationCard = ({ application, clubId, onChanged }) => {
  const [verified, setVerified] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasPayment = Boolean(application.payment_method);
  const roll = application.applicant_email.split("@")[0];

  const copyTrx = async () => {
    try {
      await navigator.clipboard.writeText(application.transaction_id);
    } catch {
      // copying is a convenience only
    }
  };

  const decide = async (action, body) => {
    setBusy(true);
    setError("");

    try {
      await apiFetch(`/api/clubs/${clubId}/applications/${application.id}/${action}`, {
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
          <h3 className="font-bold text-stone-900 text-sm font-serif">{application.applicant_name}</h3>
          <p className="text-[11px] text-stone-500">
            Roll {roll} • {application.applicant_email}
            {application.phone && ` • ${application.phone}`}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Applied {new Date(application.created_at).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="text-xs text-stone-700 space-y-2">
        <p>
          <span className="font-bold">Why they want to join: </span>
          {application.motivation}
        </p>
        {application.experience && (
          <p>
            <span className="font-bold">Experience: </span>
            {application.experience}
          </p>
        )}
      </div>

      {hasPayment && (
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-800">
              {application.payment_method === "bkash" ? "bKash" : "Cash"} • ৳{Number(application.payment_amount)}
            </span>
            <StatusBadge status={application.payment_status} label={PAYMENT_LABELS[application.payment_status]} />
          </div>

          {application.transaction_id && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] tracking-wider text-stone-800">{application.transaction_id}</span>
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

          {application.status === "pending" && (
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {application.payment_method === "bkash"
                ? `Check in your bKash app that this transaction exists and the amount is ৳${Number(
                    application.payment_amount
                  )}.`
                : "Collect the cash from the student in person before approving."}
            </p>
          )}
        </div>
      )}

      {application.status !== "pending" && application.decision_comment && (
        <p className="text-xs text-stone-700 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
          <span className="font-bold">Decision note: </span>
          {application.decision_comment}
        </p>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-2.5 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{error}</span>
        </div>
      )}

      {application.status === "pending" && (
        <div className="space-y-3 pt-1 border-t border-amber-100">
          {hasPayment && (
            <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I verified this payment{" "}
                {application.payment_method === "bkash"
                  ? "(transaction ID and amount checked in my bKash app)"
                  : "(I received the cash)"}
                .
              </span>
            </label>
          )}

          {!showReject ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => decide("approve", hasPayment ? { payment_verified: true } : {})}
                disabled={busy || (hasPayment && !verified)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Working..." : "Approve"}
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
                placeholder="Reason (the student will read this)"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => decide("reject", { comment: rejectReason })}
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
 * ClubApplicationsPage  ->  route: /clubs/:id/applications
 * Membership fee + bKash number settings, and the review queue. Only the
 * club's president can use it. The backend answers 403 to anyone else.
 */
export const ClubApplicationsPage = () => {
  const { id } = useParams();

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState("");

  const [fee, setFee] = useState("0");
  const [bkashNumber, setBkashNumber] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [tab, setTab] = useState("pending");
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const data = await apiFetch(`/api/clubs/${id}/membership-info`);
        setInfo(data);
        setFee(String(data.club.membership_fee));
        setBkashNumber(data.club.bkash_number || "");
      } catch (err) {
        setInfoError(err.message);
      }
    };

    loadInfo();
  }, [id]);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setListError("");

    try {
      const data = await apiFetch(`/api/clubs/${id}/applications?status=${tab}`);
      setApplications(data.applications);
    } catch (err) {
      setListError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, tab]);

  useEffect(() => {
    if (info && info.is_president) loadApplications();
  }, [info, loadApplications]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsMessage("");
    setIsSaving(true);

    try {
      const data = await apiFetch(`/api/clubs/${id}/membership-settings`, {
        method: "PATCH",
        body: JSON.stringify({ membership_fee: Number(fee), bkash_number: bkashNumber })
      });
      setSettingsMessage(data.message);
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (infoError) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{infoError}</span>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      </main>
    );
  }

  if (!info.is_president) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl bg-white/90 border-amber-200/80 p-6 text-sm text-stone-700 space-y-2">
          <p>Only the president of {info.club.name} can manage its applications.</p>
          <Link to="/" className="inline-block text-xs font-bold text-amber-800 hover:underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-amber-200/60 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
          <Crown className="w-5 h-5 text-amber-700" />
          <span>{info.club.name}</span>
        </h1>
        <p className="text-xs text-stone-600 mt-1">Membership applications and fee settings.</p>
      </div>

      {/* Settings */}
      <section className="glass-panel rounded-2xl border-stone-200 bg-white p-5 space-y-3">
        <h2 className="font-bold text-stone-900 text-sm font-serif">Membership fee</h2>

        <form onSubmit={saveSettings} className="space-y-3 text-xs text-stone-700">
          {settingsError && (
            <div className="flex items-start space-x-2 p-2.5 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
              <span>{settingsError}</span>
            </div>
          )}

          {settingsMessage && (
            <div className="flex items-start space-x-2 p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
              <span>{settingsMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold mb-1 block">Fee (BDT), 0 = free</label>
              <input
                type="number"
                min="0"
                step="1"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="font-semibold mb-1 block">bKash number (leave empty for cash only)</label>
              <input
                type="tel"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                placeholder="01712345678"
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-[11px] text-stone-500">
            A new fee only applies to new applications. Applications already sent keep the amount they were made with.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 text-white shadow-md transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save settings"}</span>
          </button>
        </form>
      </section>

      {/* Queue */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
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

        {!isLoading && !listError && applications.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
            No {tab === "all" ? "" : tab} applications.
          </div>
        )}

        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              clubId={id}
              onChanged={loadApplications}
            />
          ))}
        </div>
      </section>
    </main>
  );
};