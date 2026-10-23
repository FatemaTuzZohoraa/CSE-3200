import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_ACHIEVEMENTS, MOCK_USERS, MOCK_NOTIFICATIONS, MOCK_AI_SUGGESTIONS } from '../data/mockData';
import { apiFetch, resolveAssetUrl, toFormData } from '../lib/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80';

// Every time on screen is shown in Bangladesh time, whatever the laptop's timezone is.
const DHAKA = 'Asia/Dhaka';
const fmtDate = (d) => d.toLocaleDateString('en-CA', { timeZone: DHAKA }); // YYYY-MM-DD
const fmtTime = (d) =>
  d.toLocaleTimeString('en-US', { timeZone: DHAKA, hour: '2-digit', minute: '2-digit' });
const fmtFull = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: DHAKA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

// A <input type="datetime-local"> value has no timezone ("2026-11-05T14:00").
// Adding +06:00 pins it to Bangladesh time before it is sent to the backend.
const toDhakaIso = (value) => new Date(`${value}+06:00`).toISOString();

/**
 * toUiClub
 *
 * Converts one club from the backend (database shape) into the shape the club
 * screens expect. The database has a single image column (logo_url), so that
 * one image feeds both `logo` and `banner`: the card shows it large in the
 * banner area. Both stay null when the club has no uploaded image.
 */
const toUiClub = (c) => {
  const logo = resolveAssetUrl(c.logo_url);
  const members = Number(c.members_count) || 0;

  return {
    id: c.id,
    name: c.name,
    title: c.name,
    description: c.description || '',
    shortDescription: c.description || '',
    category: c.category || 'General',
    logo,
    logoUrl: logo,
    image: logo,
    banner: logo,
    members,
    memberCount: members,
    membersCount: members,
    advisor: c.advisor_name || '',
    advisorName: c.advisor_name || '',
    advisorEmail: c.advisor_email || '',
    advisorDepartment: c.advisor_department || '',
    established: c.created_at ? new Date(c.created_at).getFullYear() : undefined,
    createdAt: c.created_at
  };
};

/**
 * toUiEvent
 *
 * Backend (database) shape -> the shape the event screens use.
 * Everything about "can THIS user register?" comes from the backend
 * (can_register and register_blocked_reason). The frontend never decides
 * eligibility on its own, it only shows what the server said.
 */
const toUiEvent = (e) => {
  const start = new Date(e.start_at);
  const end = new Date(e.end_at);
  const organizer = e.organizer || (e.clubs || [])[0] || null;

  return {
    id: e.id,
    clubId: organizer ? organizer.id : null,
    clubName: organizer ? organizer.name : 'RUET Club',
    organizer, // { id, name, logo_url, bkash_number (only sent for paid events) }
    title: e.title,
    description: e.description || '',
    category: 'Event', // the events table has no category column
    date: fmtDate(start),
    time: `${fmtTime(start)} - ${fmtTime(end)}`,
    venue: e.venue,
    fee: Number(e.fee) || 0,
    isPaid: Boolean(e.is_paid),
    audience: e.audience, // 'members_only' | 'all_students'
    maxParticipants: e.capacity ?? null, // null = unlimited seats
    registeredCount: e.registered_count || 0,
    // 'Upcoming' until the event ends, then 'Past' (EventsSection tabs use these exact words)
    status: end < new Date() ? 'Past' : 'Upcoming',
    banner: resolveAssetUrl(e.image_url) || DEFAULT_BANNER,
    registrationDeadline: e.registration_deadline,
    deadlineLabel: fmtFull(e.registration_deadline),
    startLabel: fmtFull(e.start_at),
    startAt: e.start_at,
    endAt: e.end_at,
    myStatus: e.my_registration_status || null, // null | pending_payment | registered | cancelled | attended
    canRegister: Boolean(e.can_register),
    blockedReason: e.register_blocked_reason || null,
    amMember: Boolean(e.am_member),
    amHostPresident: Boolean(e.am_host_president)
  };
};

export const AppProvider = ({ children }) => {
  // The real logged-in user (AuthProvider wraps AppProvider in App.jsx)
  const { user } = useAuth();

  // Roles: 'student' | 'leader' | 'admin'  (demo switcher, still used by mock screens)
  const [currentRoleKey, setCurrentRoleKey] = useState('student');
  const currentUser = MOCK_USERS[currentRoleKey];

  // Real data, loaded from the backend
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  // IDs of events the user is registered for. Worked out from the backend's
  // answer (myStatus), so it can never disagree with the database.
  const userRegistrations = events
    .filter((e) => e.myStatus && e.myStatus !== 'cancelled')
    .map((e) => e.id);

  // Still mock
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [savedClubIds, setSavedClubIds] = useState([]);

  // Modals & Active Selections
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Public approved-club list
  const loadClubs = async () => {
    try {
      const data = await apiFetch('/api/clubs');
      setClubs((data.clubs || []).map(toUiClub));
      setClubsError('');
    } catch (err) {
      setClubsError(err.message);
    } finally {
      setClubsLoading(false);
    }
  };

  // Events need a login (the backend works out what THIS user may do),
  // so they load only when someone is logged in.
  const loadEvents = async () => {
    if (!user) {
      setEvents([]);
      setEventsError('');
      setEventsLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/events');
      setEvents((data.events || []).map(toUiEvent));
      setEventsError('');
    } catch (err) {
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  // Clubs are public: load once
  useEffect(() => {
    loadClubs();
  }, []);

  // Events: load on page load, and again whenever someone logs in or out
  useEffect(() => {
    if (user) setEventsLoading(true);
    loadEvents();
  }, [user?.id]);

  // Toggle Save Club (a local bookmark; real joining happens on the My Clubs page)
  const toggleSaveClub = (clubId) => {
    setSavedClubIds((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  };

  /**
   * addNewEvent(form)
   *
   * Sends the event to POST /api/events. The BACKEND decides whether this user
   * may do it (must be the current president of an approved club), so a failure
   * throws an Error with the server's message for the modal to display.
   *
   * Registering for an event is NOT here any more: EventRegisterModal calls the
   * backend (/api/events/:id/register) directly and then calls reloadEvents().
   */
  const addNewEvent = async (form) => {
    // multipart/form-data, because the poster is a real file. toFormData skips
    // empty values, so an empty capacity is simply not sent (= unlimited).
    const body = toFormData(
      {
        title: form.title,
        description: form.description,
        venue: form.venue,
        audience: form.audience,
        start_at: toDhakaIso(form.startAt),
        end_at: toDhakaIso(form.endAt),
        registration_deadline: toDhakaIso(form.registrationDeadline),
        capacity: form.capacity === '' ? '' : Number(form.capacity),
        fee: Number(form.fee) || 0,
        club_id: Number(form.clubId)
      },
      'poster',
      form.posterFile
    );

    const data = await apiFetch('/api/events', { method: 'POST', body });

    // Re-read the list so the screen shows exactly what is in the database
    await loadEvents();

    const created = data.event;

    // Notifications are still the local mock list (not a priority yet)
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `New Event: ${created.title}`,
        message: `${created.organizer?.name || 'A club'} published a new event at ${created.venue}.`,
        timestamp: 'Just now',
        read: false,
        type: 'announcement'
      },
      ...prev
    ]);
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
        clubsLoading,
        clubsError,
        reloadClubs: loadClubs,
        events,
        eventsLoading,
        eventsError,
        reloadEvents: loadEvents,
        achievements,
        notifications,
        userRegistrations,
        savedClubIds,
        joinedClubs: savedClubIds,
        toggleSaveClub,
        joinClub: (id) => toggleSaveClub(id),
        leaveClub: (id) => toggleSaveClub(id),
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