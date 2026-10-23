import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { StatusBadge, PAYMENT_LABELS } from "../components/StatusBadge";
import { ClipboardList, Building2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * MyApplicationsPage  ->  route: /my-applications
 * Every membership application the student made, with its status, payment
 * status and the club president's reason when it was rejected.
 */
export const MyApplicationsPage = () => {
  const location = useLocation();
  const flashMessage = location.state?.message || "";

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/applications/mine");
      setApplications(data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <ClipboardList className="w-5 h-5 text-amber-700" />
            <span>My Applications</span>
          </h1>
          <p className="text-xs text-stone-600 mt-1">Track your requests to join clubs.</p>
        </div>

        <button
          onClick={load}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-stone-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-50 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Refresh</span>
        </button>
      </div>

      {flashMessage && (
        <div className="flex items-start space-x-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
          <span>{flashMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
          You have not applied to any club yet.{" "}
          <Link to="/clubs" className="font-bold text-amber-800 hover:underline">
            Browse clubs
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="glass-panel rounded-2xl border-stone-200 bg-white p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                {app.club_logo_url ? (
                  <img
                    src={resolveAssetUrl(app.club_logo_url)}
                    alt={app.club_name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-stone-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-sm font-serif">{app.club_name}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                  {app.decided_at && ` • Decided ${new Date(app.decided_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{app.motivation}</p>

            {app.payment_method && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <span className="font-semibold">
                  {app.payment_method === "bkash" ? "bKash" : "Cash"} • ৳{Number(app.payment_amount)}
                </span>
                {app.transaction_id && (
                  <span className="font-mono text-[11px] text-stone-500">TrxID {app.transaction_id}</span>
                )}
                <StatusBadge status={app.payment_status} label={PAYMENT_LABELS[app.payment_status]} />
              </div>
            )}

            {app.decision_comment && (
              <p className="text-xs text-stone-700 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="font-bold">Club president: </span>
                {app.decision_comment}
              </p>
            )}

            {app.status === "rejected" && (
              <Link
                to={`/clubs/${app.club_id}/apply`}
                className="inline-block text-xs font-bold text-amber-800 hover:underline"
              >
                Apply again
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
};