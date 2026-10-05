import React, { useState } from "react";
import { HeroSection } from "../components/HeroSection";
import { ClubDirectory } from "../components/ClubDirectory";
import { EventsSection } from "../components/EventsSection";
import { ClubDetailsModal } from "../components/ClubDetailsModal";

/**
 * HomePage  ->  route: /
 *
 * This is the main landing page that already existed. Nothing about its content
 * changed, it is just reached through a URL now instead of a tab click.
 */
export const HomePage = () => {
  const [detailClubId, setDetailClubId] = useState(null);

  return (
    <>
      <HeroSection />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div id="clubs">
          <ClubDirectory onViewClub={(club) => setDetailClubId(club.id)} />
        </div>

        <EventsSection />
      </main>

      <ClubDetailsModal clubId={detailClubId} onClose={() => setDetailClubId(null)} />
    </>
  );
};