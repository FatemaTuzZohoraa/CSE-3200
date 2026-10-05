import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus } from 'lucide-react';

export const CreateEventModal = () => {
  const { isCreateEventModalOpen, setIsCreateEventModalOpen, addNewEvent, currentUser } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathon',
    date: '',
    time: '09:00 AM - 05:00 PM',
    venue: 'RUET Campus',
    fee: 0,
    maxParticipants: 100,
    description: '',
  });

  if (!isCreateEventModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addNewEvent(formData);
    setIsCreateEventModalOpen(false);
    setFormData({
      title: '',
      category: 'Hackathon',
      date: '',
      time: '09:00 AM - 05:00 PM',
      venue: 'RUET Campus',
      fee: 0,
      maxParticipants: 100,
      description: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8">

        {/* Header */}
        <div className="p-5 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-stone-900 font-serif">Create New Event - {currentUser.managedClubName || 'RUET Club'}</h3>
          </div>
          <button
            onClick={() => setIsCreateEventModalOpen(false)}
            className="p-1.5 rounded-full bg-amber-200/60 text-stone-700 hover:bg-amber-300/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700">
          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Event Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. RUET Intra University Coding Contest 2026"
              className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Competition">Competition</option>
                <option value="Workshop">Workshop</option>
                <option value="Fest">Fest</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>

            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Fee (BDT)</label>
              <input
                type="number"
                min="0"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Max Participant Capacity</label>
              <input
                type="number"
                min="10"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
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
              className="w-full bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:bg-white focus:border-amber-500"
            />
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
            className="w-full py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Publish Event & Notify Campus
          </button>
        </form>

      </div>
    </div>
  );
};
