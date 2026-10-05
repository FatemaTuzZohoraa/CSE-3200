import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  Compass,
  Building2,
  Calendar,
  Trophy,
  User,
  PlusCircle,
  CheckSquare,
  Bell,
  LogOut,
  LogIn,
  Shield,
  Sparkles
} from "lucide-react";

export const Navbar = () => {
  const location = useLocation();
  const { user, role, setRole, logout } = useAuth();
  const { notifications, setIsNotificationOpen } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
      isActive(path)
        ? "bg-fall-500 text-white shadow-md shadow-fall-500/20 font-bold"
        : "text-amber-900/80 hover:text-fall-600 hover:bg-amber-100/60"
    }`;

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
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-amber-950 group-hover:text-fall-600 transition-colors">
                  RUET CLUB ZONE
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-fall-100 text-fall-700 rounded-md border border-fall-200 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  FALL
                </span>
              </div>
              <p className="text-[10px] text-amber-800/70 font-medium">Rajshahi University of Engineering & Technology</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link to="/" className={navLinkClass("/")}>
              <Compass className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link to="/clubs" className={navLinkClass("/clubs")}>
              <Building2 className="w-4 h-4" />
              <span>Clubs</span>
            </Link>
            <Link to="/events" className={navLinkClass("/events")}>
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>
            <Link to="/achievements" className={navLinkClass("/achievements")}>
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </Link>
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              <User className="w-4 h-4" />
              <span>My Portal</span>
            </Link>
            <Link to="/create-club" className={navLinkClass("/create-club")}>
              <PlusCircle className="w-4 h-4" />
              <span>Create Club</span>
            </Link>
            {role === "admin" && (
              <Link to="/admin/review" className={navLinkClass("/admin/review")}>
                <CheckSquare className="w-4 h-4 text-fall-600" />
                <span>Admin Review</span>
              </Link>
            )}
          </nav>

          {/* Right Actions & Role Switcher */}
          <div className="flex items-center space-x-3">
            
            {/* Demo Role Switcher */}
            <div className="hidden sm:flex items-center space-x-1 bg-amber-100/70 p-1 rounded-xl border border-amber-900/10 text-xs">
              <span className="text-[10px] font-bold text-amber-900 px-2 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-fall-600" />
                Role:
              </span>
              {(["student", "leader", "admin"]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    role === r
                      ? "bg-fall-600 text-white shadow-sm"
                      : "text-amber-900/70 hover:text-amber-950 hover:bg-white/60"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Notification Drawer Trigger */}
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

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-amber-950">{user.name}</span>
                  <span className="text-[10px] font-medium text-fall-700 capitalize">{user.role}</span>
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

          </div>

        </div>
      </div>
    </header>
  );
};
