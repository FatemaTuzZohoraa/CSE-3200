import React from "react";
import { useApp } from "../context/AppContext";
import { EventCard } from "./EventCard";
import { Calendar } from "lucide-react";

/**
 * EventsSection
 * Public list of campus events styled with Fall aesthetic.
 */
export const EventsSection = () => {
  const { events, searchQuery, selectedCategory } = useApp();

  const filteredEvents = events.filter((e) => {
    const matchesCategory =
      selectedCategory === "All" || e.category === selectedCategory || selectedCategory === "Technology";
    const matchesQuery =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clubName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section className="space-y-6" id="events">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <span>Events & Hackathons Hub</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Register for upcoming campus workshops, flag hunts, bot battles, and fests.
          </p>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">
          No events found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </section>
  );
};