import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { apiFetch } from "../lib/api";
import {
  Compass,
  Building2,
  Calendar,
  Trophy,
  User,
  PlusCircle,
  CheckSquare,
  ClipboardList,
  Crown,
  Bell,
  LogOut,
  LogIn,
  ChevronDown,
  Menu,
  X,
  Ticket,
  Users,
  LayoutDashboard,
  FileText
} from "lucide-react";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", Icon: Compass },
  { to: "/clubs", label: "Clubs", Icon: Building2 },
  { to: "/events", label: "Events", Icon: Calendar },
  { to: "/achievements", label: "Achievements", Icon: Trophy }
];

// Everything a logged-in student can open
const PORTAL_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/my-applications", label: "My Applications", Icon: ClipboardList },
  { to: "/my-clubs", label: "My Clubs", Icon: Users },
  { to: "/my-event-registrations", label: "My Event Registrations", Icon: Ticket },
  { to: "/my-submissions", label: "My Club Submissions", Icon: FileText },
  { to: "/create-club", label: "Create a Club", Icon: PlusCircle }
];

// Only for presidents of an approved club
const MANAGE_ITEMS = [
  { to: "/manage-clubs", label: "Manage Clubs", Icon: Crown },
  { to: "/manage-events", label: "Manage Events", Icon: Calendar }
];

const ADMIN_ITEMS = [{ to: "/admin/review", label: "Admin Review", Icon: CheckSquare }];

const matches = (pathname, to) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

const linkClass = (active) =>
  `flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
    active
      ? "bg-fall-500 text-white shadow-md shadow-fall-500/20 font-bold"
      : "text-amber-900/80 hover:text-fall-600 hover:bg-amber-100/60"
  }`;

/** A button that opens a small menu of links. Closes on outside click and on navigation. */
const NavDropdown = ({ label, Icon, items, pathname }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = items.some((item) => matches(pathname, item.to));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={linkClass(active)} aria-expanded={open}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-white border border-amber-200 shadow-xl p-1.5 z-50">
          {items.map(({ to, label: itemLabel, Icon: ItemIcon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                matches(pathname, to) ? "bg-amber-100 text-fall-700" : "text-stone-700 hover:bg-amber-50"
              }`}
            >
              <ItemIcon className="w-4 h-4 text-amber-700" />
              <span>{itemLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const { notifications, setIsNotificationOpen } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPresident, setIsPresident] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isAdmin = user?.role === "admin";
  const isStudent = Boolean(user) && !isAdmin;

  // Ask the backend whether this student currently leads an approved club.
  // This only decides whether the "Manage" menu is drawn. Every manage action is
  // checked again by the server. A newly approved president sees the menu after a refresh.
  useEffect(() => {
    if (!isStudent) {
      setIsPresident(false);
      return;
    }

    let cancelled = false;

    apiFetch("/api/clubs/mine")
      .then((data) => {
        if (!cancelled) {
          setIsPresident((data.clubs || []).some((club) => club.is_president && club.status === "approved"));
        }
      })
      .catch(() => {
        if (!cancelled) setIsPresident(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isStudent]);

  // Close the phone menu after every navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const roleLabel = isAdmin ? "Admin (DSW)" : isPresident ? "Club president" : "Student";

  // Sections for the phone menu
  const mobileSections = [
    { title: null, items: PUBLIC_LINKS },
    ...(isStudent ? [{ title: "My portal", items: PORTAL_ITEMS }] : []),
    ...(isStudent && isPresident ? [{ title: "Manage", items: MANAGE_ITEMS }] : []),
    ...(isAdmin ? [{ title: "Admin", items: ADMIN_ITEMS }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-amber-900/10 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fall-500 to-fall-700 p-0.5 shadow-md shadow-fall-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center p-1">
                <img src="/ruet-logo.png" alt="RUET Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-amber-950 group-hover:text-fall-600 transition-colors">
                RUET CLUB ZONE
              </span>
              <p className="text-[10px] text-amber-800/70 font-medium hidden sm:block">
                Rajshahi University of Engineering & Technology
              </p>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {PUBLIC_LINKS.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className={linkClass(matches(pathname, to))}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}

            {isStudent && <NavDropdown label="My Portal" Icon={User} items={PORTAL_ITEMS} pathname={pathname} />}
            {isStudent && isPresident && (
              <NavDropdown label="Manage" Icon={Crown} items={MANAGE_ITEMS} pathname={pathname} />
            )}
            {isAdmin &&
              ADMIN_ITEMS.map(({ to, label, Icon }) => (
                <Link key={to} to={to} className={linkClass(matches(pathname, to))}>
                  <Icon className="w-4 h-4 text-fall-600" />
                  <span>{label}</span>
                </Link>
              ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && (
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 rounded-xl bg-white border border-amber-900/10 text-amber-900 hover:bg-amber-100/50 hover:text-fall-600 transition-all shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-fall-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-amber-950">{user.name}</span>
                  <span className="text-[10px] font-medium text-fall-700">{roleLabel}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-amber-100/60 border border-amber-900/10 text-amber-900 hover:bg-fall-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl border border-amber-900/20 text-xs font-bold text-amber-950 hover:bg-amber-100/50 transition-all flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-xl bg-fall-600 hover:bg-fall-700 text-white text-xs font-bold shadow-md shadow-fall-600/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Phone menu button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl bg-white border border-amber-900/10 text-amber-900 hover:bg-amber-100/50 transition-all shadow-sm"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Phone menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-amber-900/10 bg-[#FAF6F0] px-4 py-3 space-y-3 max-h-[75vh] overflow-y-auto">
          {mobileSections.map((section, index) => (
            <div key={section.title || index} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500">{section.title}</p>
              )}
              {section.items.map(({ to, label, Icon }) => (
                <Link key={to} to={to} className={linkClass(matches(pathname, to))}>
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
};