import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  Building2, CheckCircle2, XCircle, RefreshCw, ShieldCheck,
  Mail, Users, Clock, AlertCircle
} from "lucide-react";

/**
 * AdminClubReview
 * DSW / admin screen for reviewing club submissions.
 *
 * Hiding this screen in the UI is only cosmetic. The real protection is that
 * every request below goes to /api/admin/* which rejects non-admin tokens with
 * 403, even if someone opens the page by hand.
 */
export const AdminClubReview = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isActing, setIsActing] = useState(false);

  // Load the pending review queue
  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/admin/clubs");
      setClubs(data.clubs);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load full detail for whichever club the admin clicked
  const loadDetail = useCallback(async (clubId) => {
    try {
      const data = await apiFetch(`/api/admin/clubs/${clubId}`);
      setDetail(data);
    } catch (detailError) {
      setError(detailError.message);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleSelect = (clubId) => {
    setSelectedClubId(clubId);
    setComment("");
    setActionMessage("");
    setDetail(null);
    loadDetail(clubId);
  };

  // Approve or reject. One shared handler because the only difference is the path.
  const handleReviewAction = async (action) => {
    if (!selectedClubId) return;

    // A rejection needs a reason, so check before hitting the server.
    if (action === 'reject' && !comment.trim()) {
      setActionMessage("Please write a rejection reason first. The student will see this text.");
      return;
    }

    setIsActing(true);
    setError("");
    setActionMessage("");

    try {
      const data = await apiFetch(`/api/admin/clubs/${selectedClubId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment: comment.trim() || null })
      });

      setActionMessage(data.message);

      // Refresh both the queue and the open detail view so the new state shows.
      await loadQueue();
      await loadDetail(selectedClubId);
      setComment("");
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-fuchsia-600" />
            <span>Club Review Queue</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">Pending club submissions waiting for a DSW decision.</p>
        </div>

        <button
          onClick={loadQueue}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionMessage && (
        <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* PENDING LIST */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending ({clubs.length})</span>
          </h3>

          {isLoading && <p className="text-xs text-slate-500">Loading queue...</p>}

          {!isLoading && clubs.length === 0 && (
            <div className="glass-panel p-6 rounded-2xl border-slate-200 bg-white text-center text-slate-500 text-xs">
              Nothing pending right now.
            </div>
          )}

          <div className="space-y-2">
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => handleSelect(club.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedClubId === club.id
                    ? 'bg-pink-50 border-pink-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{club.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {club.category} • by {club.submitted_by_name || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Submitted {new Date(club.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    {club.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DETAIL + ACTIONS */}
        <div className="lg:col-span-3">
          {!selectedClubId ? (
            <div className="glass-panel p-8 rounded-2xl border-slate-200 bg-white text-center text-slate-500 text-xs">
              Select a club on the left to review its full submission.
            </div>
          ) : !detail ? (
            <div className="glass-panel p-8 rounded-2xl border-slate-200 bg-white text-center text-slate-500 text-xs">
              Loading club details...
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border-slate-200 bg-white space-y-5">

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {detail.club.logo_url ? (
                    <img src={detail.club.logo_url} alt={detail.club.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-slate-900">{detail.club.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      {detail.club.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {detail.club.category} • {detail.club.members_count} member(s) •{' '}
                    Created {new Date(detail.club.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{detail.club.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Advisor</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{detail.club.advisor_name}</p>
                  {detail.club.advisor_department && (
                    <p className="text-[10px] text-slate-500">{detail.club.advisor_department}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-cyan-700">Advisor Email</span>
                  {detail.club.advisor_email ? (
                    <a href={`mailto:${detail.club.advisor_email}`} className="flex items-center gap-1 mt-0.5 text-cyan-700 hover:underline">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{detail.club.advisor_email}</span>
                    </a>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Not provided</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-pink-700">Members</span>
                  <p className="flex items-center gap-1 font-semibold text-slate-900 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    {detail.club.members_count}
                  </p>
                </div>
              </div>

              {/* Audit trail */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Status History</h4>
                <div className="space-y-2">
                  {detail.history.map((entry) => (
                    <div key={entry.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase">{entry.action}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        by {entry.acted_by_name} ({entry.acted_by_role})
                      </p>
                      {entry.comment && <p className="text-[11px] text-slate-700 mt-1 italic">"{entry.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision */}
              <div className="border-t border-slate-200 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Review Decision</h4>

                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment for approval. Required when rejecting, e.g. 'Please attach your advisor's consent letter and resubmit.'"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-pink-500"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReviewAction('approve')}
                    disabled={isActing || detail.club.status !== 'pending'}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Club</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('reject')}
                    disabled={isActing || detail.club.status !== 'pending'}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Club</span>
                  </button>
                </div>

                {detail.club.status !== 'pending' && (
                  <p className="text-[11px] text-slate-500">
                    This club is already "{detail.club.status}", so it can no longer be approved or rejected.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};