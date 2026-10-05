import React, { createContext, useContext, useState } from 'react';
import { MOCK_CLUBS, MOCK_EVENTS, MOCK_ACHIEVEMENTS, MOCK_USERS, MOCK_NOTIFICATIONS, MOCK_AI_SUGGESTIONS } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Roles: 'student' | 'leader' | 'admin'
  const [currentRoleKey, setCurrentRoleKey] = useState('student');
  const currentUser = MOCK_USERS[currentRoleKey];

  // Datasets state (allows dynamic addition)
  const [clubs, setClubs] = useState(MOCK_CLUBS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [userRegistrations, setUserRegistrations] = useState(['evt-01']); // Event IDs registered by current student
  const [savedClubIds, setSavedClubIds] = useState(['cybersecurity-club']);

  // Modals & Active Selections
  const [selectedClub, setSelectedClub] = useState(null); // Club object for detail modal
  const [selectedEvent, setSelectedEvent] = useState(null); // Event object for detail/register modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Toggle Save Club
  const toggleSaveClub = (clubId) => {
    setSavedClubIds((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  };

  // Register for Event
  const registerForEvent = (eventId, ticketDetails = {}) => {
    if (!userRegistrations.includes(eventId)) {
      setUserRegistrations((prev) => [...prev, eventId]);
      
      // Update registered count in events list
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventId ? { ...evt, registeredCount: evt.registeredCount + 1 } : evt
        )
      );

      // Add notification
      const targetEvt = events.find((e) => e.id === eventId);
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Registration Successful! 🎟️',
        message: `You are registered for "${targetEvt ? targetEvt.title : 'Event'}". Ticket #${ticketDetails.ticketId || 'RUET-2026-TKT'} generated.`,
        timestamp: 'Just now',
        read: false,
        type: 'event'
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Create New Event (Club Leader / Admin)
  const addNewEvent = (newEventData) => {
    const created = {
      id: `evt-${Date.now()}`,
      clubId: currentUser.managedClubId || 'cyber-shield',
      clubName: currentUser.managedClubName || 'RUET Cyber Shield',
      registeredCount: 0,
      status: 'Upcoming',
      banner: newEventData.banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
      ...newEventData
    };
    setEvents((prev) => [created, ...prev]);

    // Send announcement notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `New Event: ${created.title}`,
      message: `${created.clubName} published a new event at ${created.venue}. Register now!`,
      timestamp: 'Just now',
      read: false,
      type: 'announcement'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Mark all notifications read
  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        currentRoleKey,
        setCurrentRoleKey,
        currentUser,
        clubs,
        events,
        achievements,
        notifications,
        userRegistrations,
        savedClubIds,
        joinedClubs: savedClubIds,
        toggleSaveClub,
        joinClub: (id) => toggleSaveClub(id),
        leaveClub: (id) => toggleSaveClub(id),
        registerForEvent,
        addNewEvent,
        markNotificationsAsRead,
        selectedClub,
        setSelectedClub,
        selectedEvent,
        setSelectedEvent,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        isCreateEventModalOpen,
        setIsCreateEventModalOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        isNotificationOpen: isNotificationDrawerOpen,
        setIsNotificationOpen: setIsNotificationDrawerOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        aiSuggestions: MOCK_AI_SUGGESTIONS
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
