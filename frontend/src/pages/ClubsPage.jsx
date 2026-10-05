import React, { useState } from "react";
import { ClubDirectory } from "../components/ClubDirectory";
import { ClubDetailsModal } from "../components/ClubDetailsModal";

/**
 * ClubsPage  ->  route: /clubs
 *
 * The approved club list on its own page, plus the same detail modal the home
 * page uses. Clubs come from GET /api/clubs, so anything an admin has not
 * approved yet is not visible here.
 */
export const ClubsPage = () => {
  const [detailClubId, setDetailClubId] = useState(null);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClubDirectory onViewClub={(club) => setDetailClubId(club.id)} />

      <ClubDetailsModal clubId={detailClubId} onClose={() => setDetailClubId(null)} />
    </main>
  );
};