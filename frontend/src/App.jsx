import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ClubCard } from './components/ClubCard';
import { ClubDetailModal } from './components/ClubDetailModal';
import { EventCard } from './components/EventCard';
import { EventRegisterModal } from './components/EventRegisterModal';
import { CreateEventModal } from './components/CreateEventModal';
import { AchievementShowcase } from './components/AchievementShowcase';
import { RoleDashboard } from './components/RoleDashboard';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Footer } from './components/Footer';
import { ClubDirectory } from './components/ClubDirectory';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { CreateClubModal } from './components/CreateClubModal';
import { MySubmissions } from './components/MySubmissions';
import { AdminClubReview } from './components/AdminClubReview';
import { Building2, Calendar, Filter } from 'lucide-react';

const MainContent = () => {
  const { 
    activeTab, 
    events, 
    searchQuery, 
    selectedCategory, 
    setSelectedCategory 
  } = useApp();

  // Real logged-in user from the backend auth system
  const { user } = useAuth();

  // The Navbar owns the login and create-club modals. This page only needs to
  // know which club to show in the details modal.
  const [detailClubId, setDetailClubId] = useState(null);

  const categories = ['All', 'Technology', 'Robotics', 'Career', 'Cultural', 'Sports'];

  // Filter Events
  const filteredEvents = events.filter((e) => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory || selectedCategory === 'Technology';
    const matchesQuery = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.clubName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <div>
        <Navbar />

        {/* Home Hero Section */}
        {activeTab === 'home' && <HeroSection />}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          
          {/* APPROVED CLUBS (real data from GET /api/clubs) */}
          {(activeTab === 'home' || activeTab === 'clubs') && (
            <div id="clubs">
              <ClubDirectory onViewClub={(club) => setDetailClubId(club.id)} />
            </div>
          )}

          {/* MY SUBMISSIONS: clubs the logged-in student submitted */}
          {activeTab === 'my-submissions' && (
            <MySubmissions />
          )}

          {/* ADMIN REVIEW QUEUE: only rendered for role = 'admin' */}
          {activeTab === 'admin-review' && user?.role === 'admin' && (
            <AdminClubReview />
          )}

          {/* HOME OR EVENTS VIEW */}
          {(activeTab === 'home' || activeTab === 'events') && (
            <section className="space-y-6" id="events">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-rose-600" />
                    <span>Events & Hackathons Hub</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Register for upcoming campus workshops, flag hunts, bot battles, and fests.
                  </p>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
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
          )}

          {/* ACHIEVEMENTS VIEW */}
          {activeTab === 'achievements' && <AchievementShowcase />}

          {/* MY PORTAL / DASHBOARD VIEW */}
          {activeTab === 'dashboard' && <RoleDashboard />}

        </main>
      </div>

      {/* Global Modals & Overlay Drawers */}
      <ClubDetailModal />
      <EventRegisterModal />
      <CreateEventModal />
      <NotificationDrawer />

      {/* Club details modal (backed by the real API) */}
      <ClubDetailsModal clubId={detailClubId} onClose={() => setDetailClubId(null)} />

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}
