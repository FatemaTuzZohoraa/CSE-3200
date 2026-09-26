import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import { Building2, Calendar, Filter } from 'lucide-react';

const MainContent = () => {
  const { 
    activeTab, 
    clubs, 
    events, 
    searchQuery, 
    selectedCategory, 
    setSelectedCategory 
  } = useApp();

  const categories = ['All', 'Technology', 'Robotics', 'Career', 'Cultural', 'Sports'];

  // Filter Clubs
  const filteredClubs = clubs.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

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
          
          {/* HOME OR CLUBS VIEW */}
          {(activeTab === 'home' || activeTab === 'clubs') && (
            <section className="space-y-6" id="clubs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-pink-600" />
                    <span>Ruet Clubs Directory</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Explore university-recognized clubs, executive teams, and recruitment openings.
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <Filter className="w-4 h-4 text-purple-400 shrink-0 mr-1" />
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-md shadow-pink-500/20'
                          : 'bg-white text-slate-600 border border-purple-100 hover:bg-purple-50 hover:text-purple-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredClubs.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
                  No clubs found matching your filter criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              )}
            </section>
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

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
