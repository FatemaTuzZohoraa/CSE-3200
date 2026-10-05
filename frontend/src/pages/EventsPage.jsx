import React from "react";
import { EventsSection } from "../components/EventsSection";

/**
 * EventsPage  ->  route: /events
 *
 * Still driven by mock data for now, since there is no /api/events route yet.
 */
export const EventsPage = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <EventsSection />
  </main>
);