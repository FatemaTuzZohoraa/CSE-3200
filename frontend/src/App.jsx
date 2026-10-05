import React from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards";
import { ClubDetailModal } from "./components/ClubDetailModal";
import { EventRegisterModal } from "./components/EventRegisterModal";
import { CreateEventModal } from "./components/CreateEventModal";
import { NotificationDrawer } from "./components/NotificationDrawer";

import { HomePage } from "./pages/HomePage";
import { ClubsPage } from "./pages/ClubsPage";
import { EventsPage } from "./pages/EventsPage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { CreateClubPage } from "./pages/CreateClubPage";
import { MySubmissionsPage } from "./pages/MySubmissionsPage";
import { MyClubsPage } from "./pages/MyClubsPage";
import { AdminReviewPage } from "./pages/AdminReviewPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * SiteLayout
 *
 * The frame every normal page sits in: navbar on top, footer at the bottom, and
 * the modals that were previously mounted in App.jsx. <Outlet /> is where the
 * matched page component renders.
 *
 * Scroll position is reset on navigation, otherwise switching pages keeps the
 * old scroll offset and can land you halfway down a new page.
 */
const SiteLayout = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <div>
        <Navbar />

        <Outlet />
      </div>

      {/* Global modals and the notification drawer */}
      <ClubDetailModal />
      <EventRegisterModal />
      <CreateEventModal />
      <NotificationDrawer />

      <Footer />
    </div>
  );
};

/**
 * App
 *
 * Routing replaces the old activeTab string switching:
 *
 *   /                 Home        (hero + clubs + events)
 *   /clubs            Clubs
 *   /events           Events
 *   /achievements     Achievements
 *   /dashboard        My Portal
 *   /create-club      Create a club          (needs login)
 *   /my-submissions   My club submissions    (needs login)
 *   /my-clubs         Join / leave clubs      (needs login)
 *   /admin/review     Club review queue       (needs login + role admin)
 *   /login            Login                   (no navbar)
 *   /signup           Signup                  (no navbar)
 */
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Login and Signup stand on their own, no navbar. */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Everything else shares the site frame. */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route
                path="/create-club"
                element={
                  <ProtectedRoute>
                    <CreateClubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-submissions"
                element={
                  <ProtectedRoute>
                    <MySubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-clubs"
                element={
                  <ProtectedRoute>
                    <MyClubsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/review"
                element={
                  <AdminRoute>
                    <AdminReviewPage />
                  </AdminRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}