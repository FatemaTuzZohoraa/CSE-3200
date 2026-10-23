import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, MapPin, Users, Ticket, CheckCircle2, Clock, Lock, Globe } from 'lucide-react';

// What the card's button says, based ONLY on what the backend told us.
const getAction = (event) => {
  if (event.myStatus === 'registered' || event.myStatus === 'attended') {
    return { label: 'Registered - view details', tone: 'done', Icon: CheckCircle2 };
  }
  if (event.myStatus === 'pending_payment') {
    return { label: 'Payment pending - view', tone: 'wait', Icon: Clock };
  }
  if (event.canRegister) {
    return {
      label: event.isPaid ? `Register (${event.fee} BDT)` : 'Free Register',
      tone: 'go',
      Icon: Ticket
    };
  }
  return { label: 'View details', tone: 'muted', Icon: Ticket };
};

const toneClass = {
  go: 'bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white shadow-md',
  done: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300',
  wait: 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300',
  muted: 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
};

export const EventCard = ({ event }) => {
  const { setSelectedEvent, setIsRegisterModalOpen } = useApp();

  const hasLimit = event.maxParticipants !== null && event.maxParticipants > 0;
  const percentFilled = hasLimit
    ? Math.min(100, Math.round((event.registeredCount / event.maxParticipants) * 100))
    : 0;

  const action = getAction(event);
  const ActionIcon = action.Icon;

  const openDetails = () => {
    setSelectedEvent(event);
    setIsRegisterModalOpen(true);
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border-stone-200 flex flex-col justify-between group bg-white/90">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-amber-50/50">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-amber-900 border border-amber-200 backdrop-blur-md flex items-center gap-1">
            {event.audience === 'members_only' ? (
              <><Lock className="w-3 h-3" /> Members only</>
            ) : (
              <><Globe className="w-3 h-3" /> Open to all RUET</>
            )}
          </span>

          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${event.isPaid ? 'bg-orange-800 text-white font-mono' : 'bg-amber-800 text-white'}`}>
            {event.isPaid ? `${event.fee} BDT` : 'FREE'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.status === 'Upcoming' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-600'}`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">{event.clubName}</div>
          <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 font-serif">
            {event.title}
          </h3>
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{event.description}</p>
        </div>

        <div className="space-y-1.5 py-2 border-y border-amber-100 text-[11px] text-stone-700">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate"><strong>{event.date}</strong> • {event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-orange-700 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">Register by {event.deadlineLabel}</span>
          </div>
        </div>

        {/* Seats */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-stone-500">
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-amber-700" />
              <span>
                Registered: <strong>{event.registeredCount}{hasLimit ? ` / ${event.maxParticipants}` : ''}</strong>
                {!hasLimit && ' (unlimited seats)'}
              </span>
            </span>
            {hasLimit && <span className="font-bold text-amber-800">{percentFilled}%</span>}
          </div>
          {hasLimit && (
            <div className="w-full bg-amber-100/60 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${percentFilled >= 90 ? 'bg-orange-700' : 'bg-gradient-to-r from-amber-600 to-orange-700'}`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          )}
        </div>

        <button
          onClick={openDetails}
          className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all ${toneClass[action.tone]}`}
        >
          <ActionIcon className="w-4 h-4" />
          <span>{action.label}</span>
        </button>
      </div>
    </div>
  );
};