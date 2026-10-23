import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { X, Plus } from 'lucide-react';

const inputClass =
  'w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500';

const emptyForm = {
  title: '',
  clubId: '',
  audience: 'all_students',
  startAt: '',
  endAt: '',
  registrationDeadline: '',
  venue: 'RUET Campus',
  fee: 0,
  capacity: '', // empty = unlimited seats
  posterFile: null, // optional poster image (uploaded to Cloudinary by the backend)
  description: ''
};

export const CreateEventModal = () => {
  const { isCreateEventModalOpen, setIsCreateEventModalOpen, addNewEvent } = useApp();

  const [formData, setFormData] = useState(emptyForm);
  const [myClubs, setMyClubs] = useState([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each time the modal opens, load the clubs this user can host events for.
  // These are the user's APPROVED clubs. The backend re-checks that the user is
  // really the president when the event is submitted.
  useEffect(() => {
    if (!isCreateEventModalOpen) return;

    const loadMyClubs = async () => {
      setIsLoadingClubs(true);
      setError('');

      try {
        const data = await apiFetch('/api/clubs/mine');
        const approved = (data.clubs || []).filter((club) => club.status === 'approved');

        setMyClubs(approved);
        setFormData((prev) => ({
          ...prev,
          clubId: prev.clubId || (approved[0] ? String(approved[0].id) : '')
        }));
      } catch (err) {
        setMyClubs([]);
        setError(err.message);
      } finally {
        setIsLoadingClubs(false);
      }
    };

    loadMyClubs();
  }, [isCreateEventModalOpen]);

  if (!isCreateEventModalOpen) return null;

  const closeModal = () => {
    setIsCreateEventModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await addNewEvent(formData);
      setFormData(emptyForm);
      setIsCreateEventModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* Header */}
        <div className="p-5 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-stone-900 font-serif">Create New Event</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-full bg-amber-200/60 text-stone-700 hover:bg-amber-300/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-xs text-stone-700">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
              {error}
            </div>
          )}

          {isLoadingClubs ? (
            <p className="text-stone-500">Loading your clubs...</p>
          ) : myClubs.length === 0 ? (
            <p className="leading-relaxed">
              You can only create events for an approved club where you are the president.
              Submit a club and wait for DSW approval first.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-stone-700 font-semibold mb-1 block">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. RUET Intra University Coding Contest 2026"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Hosting Club</label>
                  <select
                    required
                    value={formData.clubId}
                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                    className={inputClass}
                  >
                    {myClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Fee (BDT, 0 = free)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Starts</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Ends</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 block">Who can register?</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className={inputClass}
                >
                  <option value="all_students">All RUET students</option>
                  <option value="members_only">Club members only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Registration Closes</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-semibold mb-1 block">Max Participants (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Empty = unlimited"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 block">Venue</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Central Auditorium / CCC Lab 2"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 block">Event Poster (optional)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    if (file && file.size > 3 * 1024 * 1024) {
                      setError('The poster must be 3 MB or smaller');
                      e.target.value = '';
                      return;
                    }
                    setError('');
                    setFormData({ ...formData, posterFile: file });
                  }}
                  className={inputClass}
                />
                <p className="text-[10px] text-stone-500 mt-1">PNG, JPG or WEBP, up to 3 MB. A wide image (16:9) looks best.</p>
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 block">Event Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide event overview, rules, and eligibility..."
                  className="w-full bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Event'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};