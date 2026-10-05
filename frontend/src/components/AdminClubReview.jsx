import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  Building2, CheckCircle2, XCircle, RefreshCw, ShieldCheck,
  Mail, Users, Clock, AlertCircle
} from "lucide-react";

/**
 * AdminClubReview
 * DSW / admin screen for reviewing club submissions styled with Fall Vibe theme.
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

  const handleReviewAction = async (action) => {
    if (!selectedClubId) return;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2 font-serif">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Club Review Queue</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1">Pending club submissions waiting for a DSW decision.</p>
        </div>

        <button
          onClick={loadQueue}
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

      {actionMessage && (
        <div className="flex items-start space-x-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* PENDING LIST */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2 font-serif">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Pending ({clubs.length})</span>
          </h3>

          {isLoading && <p className="text-xs text-stone-500">Loading queue...</p>}

          {!isLoading && clubs.length === 0 && (
            <div className="glass-panel p-6 rounded-2xl border-stone-200 bg-white text-center text-stone-500 text-xs">
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
                    ? 'bg-amber-100/70 border-amber-400 shadow-sm'
                    : 'bg-white border-amber-200/80 hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm font-serif">{club.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {club.category} • by {club.submitted_by_name || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Submitted {new Date(club.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-950 border border-orange-300 shrink-0">
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
            <div className="glass-panel p-8 rounded-2xl border-stone-200 bg-white text-center text-stone-500 text-xs">
              Select a club on the left to review its full submission.
            </div>
          ) : !detail ? (
            <div className="glass-panel p-8 rounded-2xl border-stone-200 bg-white text-center text-stone-500 text-xs">
              Loading club details...
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border-stone-200 bg-white space-y-5">

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50/50 border-2 border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                  {detail.club.logo_url ? (
                    <img src={detail.club.logo_url} alt={detail.club.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Building2 className="w-7 h-7 text-stone-300" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-stone-900 font-serif">{detail.club.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-950 border border-orange-300">
                      {detail.club.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {detail.club.category} • {detail.club.members_count} member(s) •{' '}
                    Created {new Date(detail.club.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-900 mb-1 font-serif">Description</h4>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{detail.club.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Advisor</span>
                  <p className="font-semibold text-stone-900 mt-0.5">{detail.club.advisor_name}</p>
                  {detail.club.advisor_department && (
                    <p className="text-[10px] text-stone-500">{detail.club.advisor_department}</p>
                  )}
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-orange-800">Advisor Email</span>
                  {detail.club.advisor_email ? (
                    <a href={`mailto:${detail.club.advisor_email}`} className="flex items-center gap-1 mt-0.5 text-amber-800 hover:underline">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{detail.club.advisor_email}</span>
                    </a>
                  ) : (
                    <p className="text-[10px] text-stone-400 mt-0.5">Not provided</p>
                  )}
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-900">Members</span>
                  <p className="flex items-center gap-1 font-semibold text-stone-900 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    {detail.club.members_count}
                  </p>
                </div>
              </div>

              {/* Audit trail */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 mb-2 font-serif">Status History</h4>
                <div className="space-y-2">
                  {detail.history.map((entry) => (
                    <div key={entry.id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 uppercase">{entry.action}</span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1">
                        by {entry.acted_by_name} ({entry.acted_by_role})
                      </p>
                      {entry.comment && <p className="text-[11px] text-stone-700 mt-1 italic">"{entry.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision */}
              <div className="border-t border-amber-200/60 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 font-serif">Review Decision</h4>

                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment for approval. Required when rejecting, e.g. 'Please attach your advisor's consent letter and resubmit.'"
                  className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReviewAction('approve')}
                    disabled={isActing || detail.club.status !== 'pending'}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Club</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('reject')}
                    disabled={isActing || detail.club.status !== 'pending'}
                    className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Club</span>
                  </button>
                </div>

                {detail.club.status !== 'pending' && (
                  <p className="text-[11px] text-stone-500">
                    This submission has already been processed and its status is {detail.club.status}.
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
