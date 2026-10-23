import React, { useState } from "react";
import { apiFetch, resolveAssetUrl } from "../lib/api";
import { X, Pencil, Info } from "lucide-react";

const inputClass =
  "w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

// ISO time from the backend -> the text a <input type="datetime-local"> needs, in Dhaka time
const toInput = (iso) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" }).slice(0, 16).replace(" ", "T");

// datetime-local text (no timezone) -> ISO string pinned to Bangladesh time
const toDhakaIso = (value) => new Date(`${value}+06:00`).toISOString();

/**
 * EditEventModal
 *
 * `event` is one row from GET /api/events/managed (database field names).
 * Only the fields the leader actually changed are sent. The backend re-checks
 * everything, including the rules that lock the fee and audience once students
 * have registered.
 */
export const EditEventModal = ({ event, onClose, onSaved }) => {
  const initial = {
    title: event.title,
    description: event.description || "",
    venue: event.venue,
    startAt: toInput(event.start_at),
    endAt: toInput(event.end_at),
    registrationDeadline: toInput(event.registration_deadline),
    capacity: event.capacity === null ? "" : String(event.capacity),
    fee: String(event.fee),
    audience: event.audience
  };

  const [form, setForm] = useState(initial);
  const [posterFile, setPosterFile] = useState(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const locked = event.registered_count > 0; // fee + audience cannot change after registrations
  const currentPoster = resolveAssetUrl(event.image_url);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const body = new FormData();

    if (form.title !== initial.title) body.append("title", form.title);
    if (form.description !== initial.description) body.append("description", form.description);
    if (form.venue !== initial.venue) body.append("venue", form.venue);
    if (form.startAt !== initial.startAt) body.append("start_at", toDhakaIso(form.startAt));
    if (form.endAt !== initial.endAt) body.append("end_at", toDhakaIso(form.endAt));
    if (form.registrationDeadline !== initial.registrationDeadline) {
      body.append("registration_deadline", toDhakaIso(form.registrationDeadline));
    }
    // An empty capacity is sent on purpose: it means "unlimited seats"
    if (form.capacity !== initial.capacity) body.append("capacity", form.capacity);
    if (!locked && form.fee !== initial.fee) body.append("fee", form.fee);
    if (!locked && form.audience !== initial.audience) body.append("audience", form.audience);

    if (posterFile) body.append("poster", posterFile);
    else if (removePoster) body.append("remove_poster", "true");

    if ([...body.keys()].length === 0) {
      setError("You have not changed anything.");
      return;
    }

    setIsSaving(true);

    try {
      const data = await apiFetch(`/api/events/${event.id}`, { method: "PATCH", body });
      onSaved(data.message);
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Pencil className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-stone-900 font-serif">Edit event</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-amber-200/60 text-stone-700 hover:bg-amber-300/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">{error}</div>
          )}

          {locked && (
            <div className="flex items-start gap-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
              <span>
                {event.registered_count} student(s) already registered, so the fee and audience are locked.
                Capacity cannot go below that number.
              </span>
            </div>
          )}

          <div>
            <label className="font-semibold mb-1 block">Event title</label>
            <input type="text" required value={form.title} onChange={set("title")} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold mb-1 block">Fee (BDT, 0 = free)</label>
              <input
                type="number"
                min="0"
                disabled={locked}
                value={form.fee}
                onChange={set("fee")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-semibold mb-1 block">Who can register?</label>
              <select disabled={locked} value={form.audience} onChange={set("audience")} className={inputClass}>
                <option value="all_students">All RUET students</option>
                <option value="members_only">Club members only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold mb-1 block">Starts</label>
              <input type="datetime-local" required value={form.startAt} onChange={set("startAt")} className={inputClass} />
            </div>
            <div>
              <label className="font-semibold mb-1 block">Ends</label>
              <input type="datetime-local" required value={form.endAt} onChange={set("endAt")} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold mb-1 block">Registration closes</label>
              <input
                type="datetime-local"
                required
                value={form.registrationDeadline}
                onChange={set("registrationDeadline")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-semibold mb-1 block">Max participants (optional)</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="Empty = unlimited"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold mb-1 block">Venue</label>
            <input type="text" required value={form.venue} onChange={set("venue")} className={inputClass} />
          </div>

          <div>
            <label className="font-semibold mb-1 block">Description</label>
            <textarea rows={3} value={form.description} onChange={set("description")} className={inputClass} />
          </div>

          <div className="space-y-2">
            <label className="font-semibold block">Poster</label>
            {currentPoster && !removePoster && !posterFile && (
              <img src={currentPoster} alt="Current poster" className="h-24 rounded-xl border border-amber-200 object-cover" />
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files[0] || null;
                if (file && file.size > 3 * 1024 * 1024) {
                  setError("The poster must be 3 MB or smaller");
                  e.target.value = "";
                  return;
                }
                setError("");
                setPosterFile(file);
              }}
              className={inputClass}
            />
            {currentPoster && !posterFile && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={removePoster} onChange={(e) => setRemovePoster(e.target.checked)} />
                <span>Remove the current poster</span>
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs rounded-xl border border-amber-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};