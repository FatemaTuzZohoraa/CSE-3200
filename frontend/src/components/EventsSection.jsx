import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { EventCard } from "./EventCard";
import { Calendar } from "lucide-react";

export const EventsSection = () => {
  const { events, eventsLoading, eventsError, searchQuery } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState("Upcoming");

  const filtered = events
    .filter((e) => e.status === tab)
    .filter((e) => {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.clubName.toLowerCase().includes(q);
    });

  // Past events read better newest first
  const visible = tab === "Past" ? [...filtered].reverse() : filtered;

  return (
    <section className="space-y-6" id="events">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <span>Events Hub</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Register for upcoming campus workshops, contests and fests.
          </p>
        </div>

        {user && (
          <div className="flex gap-2 text-xs font-bold">
            {["Upcoming", "Past"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  tab === t ? "bg-amber-700 text-white border-amber-700" : "bg-white text-amber-900 border-amber-200 hover:bg-amber-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {!user ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-600 text-sm space-y-3">
          <p>Log in with your RUET account to browse and register for events.</p>
          <Link to="/login" className="inline-block px-4 py-2 rounded-xl bg-fall-600 text-white text-xs font-bold">
            Log In
          </Link>
        </div>
      ) : eventsLoading ? (
        <p className="text-center text-stone-500 text-sm py-8">Loading events...</p>
      ) : eventsError ? (
        <p className="text-center text-orange-700 text-sm py-8">{eventsError}</p>
      ) : visible.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
          No {tab.toLowerCase()} events found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </section>
  );
};