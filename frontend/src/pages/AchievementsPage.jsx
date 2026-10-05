import React from "react";
import { AchievementShowcase } from "../components/AchievementShowcase";

/**
 * AchievementsPage  ->  route: /achievements
 *
 * The schema has no achievements table, so these cards still come from
 * MOCK_ACHIEVEMENTS (see data/mockData.js, sourced from the docx list).
 * When an achievements table is added later, only this page has to change.
 */
export const AchievementsPage = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <AchievementShowcase />
  </main>
);