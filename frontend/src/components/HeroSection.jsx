import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, Shield, Calendar, Trophy } from 'lucide-react';

export const HeroSection = () => {
  const { setActiveTab, clubs, events, achievements } = useApp();

  const featuredEvent = events[0] || {
    title: 'Cyber Treasure Hunt 2.0',
    clubName: 'RUET Cybersecurity Club',
    date: '18.09.2026',
    venue: 'Online',
    registeredCount: 142,
    maxParticipants: 200
  };

  const percentFilled = Math.min(100, Math.round((featuredEvent.registeredCount / featuredEvent.maxParticipants) * 100));

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-pink-50/30 to-white py-16 border-b border-purple-100">
      
      {/* Background soft glow graphics */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-pink-400/15 via-purple-400/15 to-indigo-400/15 blur-3xl pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-pink-900 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Centralized Club Portal for Rajshahi University of Engineering & Technology</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
              Welcome to <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Ruet Club Zone</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
              Discover student clubs, technical events, cybersecurity challenges, astronomy sky observations, and national achievements. Join clubs and connect with RUET innovators.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab('clubs')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-pink-500/20 transform hover:-translate-y-0.5 transition-all"
              >
                <span>Explore RUET Clubs</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-purple-900 font-bold text-sm shadow-xs transition-all"
              >
                <Calendar className="w-4 h-4 text-pink-600" />
                <span>Upcoming Events</span>
              </button>
            </div>

            {/* Quick Live Platform Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-purple-100">
              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="flex items-center space-x-2 text-pink-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-2xl font-extrabold text-slate-900">{clubs.length}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Active RUET Clubs</p>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="flex items-center space-x-2 text-purple-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-2xl font-extrabold text-slate-900">{events.length}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Campus Events</p>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="flex items-center space-x-2 text-fuchsia-600">
                  <Trophy className="w-4 h-4" />
                  <span className="text-2xl font-extrabold text-slate-900">{achievements.length}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">National Trophies</p>
              </div>
            </div>

          </div>

          {/* Right Hero Graphic Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Card Container */}
              <div className="relative rounded-2xl glass-panel p-6 shadow-xl space-y-5 border-purple-100">
                
                <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-xl shadow-md text-white">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Featured Highlight</h4>
                      <p className="text-sm font-bold text-slate-900">{featuredEvent.title}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-pink-50 text-pink-700 border border-pink-200">
                    Upcoming
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Organizer:</span>
                    <span className="font-semibold text-slate-800">{featuredEvent.clubName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Date & Venue:</span>
                    <span className="font-semibold text-slate-800">{featuredEvent.date} • {featuredEvent.venue}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Registered Students:</span>
                    <span className="font-bold text-pink-600">{featuredEvent.registeredCount} / {featuredEvent.maxParticipants} Seats</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Capacity Filled</span>
                    <span className="font-bold text-purple-600">{percentFilled}%</span>
                  </div>
                  <div className="w-full bg-purple-100/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('events')}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md text-center transition-all"
                >
                  View Details & Register →
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
