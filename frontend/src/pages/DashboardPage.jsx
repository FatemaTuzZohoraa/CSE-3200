import React from "react";
import { RoleDashboard } from "../components/RoleDashboard";

/**
 * DashboardPage  ->  route: /dashboard
 *
 * "My Portal". This is still the original mock role dashboard, kept as it is so
 * the navbar role switcher keeps driving something. It reads from AppContext, not
 * from the backend session.
 */
export const DashboardPage = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <RoleDashboard />
  </main>
);