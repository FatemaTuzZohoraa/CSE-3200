import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Calendar, 
  Award, 
  LayoutDashboard, 
  Bell, 
  Search, 
  PlusCircle, 
  UserCheck, 
  ChevronDown, 
  ShieldAlert, 
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { 
    currentRoleKey, 
    setCurrentRoleKey, 
    activeTab, 
    setActiveTab, 
    notifications, 
    setIsNotificationDrawerOpen,
    setIsCreateEventModalOpen,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels = {
    student: { title: 'Student', icon: GraduationCap, color: 'text-pink-700 bg-pink-50 border-pink-200' },
    leader: { title: 'Club Leader', icon: UserCheck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    admin: { title: 'University Admin', icon: ShieldAlert, color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200' }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Building2 },
    { id: 'clubs', label: 'Clubs', icon: Building2 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'dashboard', label: 'My Portal', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-purple-200 shrink-0">
              <img src="/ruet-logo.png" alt="RUET Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Ruet Club Zone
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-200">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Rajshahi University of Engineering & Technology</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-pink-700 bg-pink-50 border border-pink-200 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Search, Create Event, Role Selector, Notifications */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clubs, events..."
                className="w-44 lg:w-56 bg-purple-50/50 border border-purple-100 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-purple-300 focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            {/* Create Event Button (for Club Leader / Admin) */}
            {(currentRoleKey === 'leader' || currentRoleKey === 'admin') && (
              <button
                onClick={() => setIsCreateEventModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  roleLabels[currentRoleKey].color
                }`}
              >
                {React.createElement(roleLabels[currentRoleKey].icon, { className: 'w-4 h-4' })}
                <span className="capitalize">{roleLabels[currentRoleKey].title}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Switch Active Demo Role
                  </div>
                  <div className="mt-1 space-y-1">
                    {Object.keys(roleLabels).map((key) => {
                      const item = roleLabels[key];
                      const Icon = item.icon;
                      const isSelected = currentRoleKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentRoleKey(key);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-start space-x-2.5 p-2 rounded-xl text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-cyan-50 border border-cyan-200 text-cyan-800'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mt-0.5 text-slate-400" />
                          <div>
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-[10px] text-slate-500">
                              {key === 'student' && 'Fatema Tuz Zohora (CSE 22)'}
                              {key === 'leader' && 'Anika Rahman (Cyber President)'}
                              {key === 'admin' && 'Prof. Dr. M. A. Samad (DSW)'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2 text-slate-600 bg-slate-100 border border-slate-200 rounded-xl"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 bg-slate-100 border border-slate-200 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-3 shadow-lg">
          <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, events..."
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === item.id ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-slate-600'
                }`}
              >
                {React.createElement(item.icon, { className: 'w-4 h-4' })}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Current Demo Role:</span>
            <select
              value={currentRoleKey}
              onChange={(e) => setCurrentRoleKey(e.target.value)}
              className="bg-slate-100 text-cyan-700 text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1"
            >
              <option value="student">Student</option>
              <option value="leader">Club Leader</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
