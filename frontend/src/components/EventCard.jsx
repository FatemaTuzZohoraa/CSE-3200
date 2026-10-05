import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, MapPin, Users, Ticket, CheckCircle2 } from 'lucide-react';

export const EventCard = ({ event }) => {
  const { setSelectedEvent, setIsRegisterModalOpen, userRegistrations } = useApp();
  const isRegistered = userRegistrations.includes(event.id);
  const percentFilled = Math.min(100, Math.round((event.registeredCount / event.maxParticipants) * 100));

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border-stone-200 flex flex-col justify-between group bg-white/90">

      {/* Event Banner */}
      <div className="relative h-44 overflow-hidden bg-amber-50/50">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

        {/* Category & Fee Overlay Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-amber-900 border border-amber-200 backdrop-blur-md shadow-xs">
            {event.category}
          </span>

          <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-xs ${event.fee === 0
              ? 'bg-amber-800 text-white'
              : 'bg-orange-800 text-white font-mono'
            }`}>
            {event.fee === 0 ? 'FREE' : `${event.fee} BDT`}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.status === 'Upcoming' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-600'
            }`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Event Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
            {event.clubName}
          </div>

          <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 font-serif">
            {event.title}
          </h3>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Date, Time & Venue */}
        <div className="space-y-1.5 py-2 border-y border-amber-100 text-[11px] text-stone-700">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate"><strong>{event.date}</strong> • {event.time}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-orange-700 shrink-0" />
            <span className="truncate text-stone-700">{event.venue}</span>
          </div>
        </div>

        {/* Seat Fill Capacity Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-stone-500">
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-amber-700" />
              <span>Registered: <strong>{event.registeredCount} / {event.maxParticipants}</strong></span>
            </span>
            <span className="font-bold text-amber-800">{percentFilled}%</span>
          </div>
          <div className="w-full bg-amber-100/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${percentFilled >= 90 ? 'bg-orange-700' : 'bg-gradient-to-r from-amber-600 to-orange-700'
                }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isRegistered ? (
            <button
              onClick={() => {
                setSelectedEvent(event);
                setIsRegisterModalOpen(true);
              }}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 flex items-center justify-center space-x-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>Registered • View QR Ticket</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedEvent(event);
                setIsRegisterModalOpen(true);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all"
            >
              <Ticket className="w-4 h-4" />
              <span>{event.fee === 0 ? 'Free Register' : `Register (${event.fee} BDT)`}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
