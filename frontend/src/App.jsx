import React from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards";
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
import { ApplyToClubPage } from "./pages/ApplyToClubPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import { ManageClubsPage } from "./pages/ManageClubsPage";
import { ClubApplicationsPage } from "./pages/ClubApplicationsPage";
import { ManageEventsPage } from "./pages/ManageEventsPage";
import { EventRegistrationsPage } from "./pages/EventRegistrationsPage";
import { MyEventRegistrationsPage } from "./pages/MyEventRegistrationsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * SiteLayout
 *
 * The frame every normal page sits in: navbar on top, footer at the bottom, and
 * the global modals. <Outlet /> is where the matched page component renders.
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
 *   /                                   Home        (hero + clubs + events)
 *   /clubs                              Clubs
 *   /clubs/:id/apply                    Apply to join a club          (needs login)
 *   /clubs/:id/applications             Review applications + fee     (needs login; president only, enforced by the backend)
 *   /events                             Events                        (needs login to see the list)
 *   /my-event-registrations             My event registrations        (needs login)
 *   /manage-events                      Events of clubs I lead        (needs login; president only, enforced by the backend)
 *   /manage-events/:id/registrations    Registrations + payments      (needs login; host club president only)
 *   /achievements                       Achievements
 *   /dashboard                          My Portal
 *   /create-club                        Create a club                 (needs login)
 *   /my-submissions                     My club submissions           (needs login)
 *   /my-clubs                           My memberships                (needs login)
 *   /my-applications                    My membership applications    (needs login)
 *   /manage-clubs                       Clubs I lead                  (needs login)
 *   /admin/review                       Club review queue             (needs login + role admin)
 *   /login                              Login                         (no navbar)
 *   /signup                             Signup                        (no navbar)
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
                path="/clubs/:id/apply"
                element={
                  <ProtectedRoute>
                    <ApplyToClubPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs/:id/applications"
                element={
                  <ProtectedRoute>
                    <ClubApplicationsPage />
                  </ProtectedRoute>
                }
              />
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
                path="/my-applications"
                element={
                  <ProtectedRoute>
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-event-registrations"
                element={
                  <ProtectedRoute>
                    <MyEventRegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-clubs"
                element={
                  <ProtectedRoute>
                    <ManageClubsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-events"
                element={
                  <ProtectedRoute>
                    <ManageEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-events/:id/registrations"
                element={
                  <ProtectedRoute>
                    <EventRegistrationsPage />
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