import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Calendar, Trophy, Bookmark, ExternalLink } from 'lucide-react';

export const ClubCard = ({ club }) => {
  const { setSelectedClub, savedClubIds, toggleSaveClub } = useApp();
  const isSaved = savedClubIds.includes(club.id);

  const categoryStyles = {
    Technology: 'badge-tech text-white',
    Robotics: 'badge-robotics text-white',
    Career: 'badge-career text-white',
    Cultural: 'badge-cultural text-white',
    Sports: 'badge-sports text-white',
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border-slate-200 flex flex-col justify-between group">
      
      {/* Club Banner & Logo */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={club.banner}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

        {/* Category Badge & Save Button */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
            categoryStyles[club.category] || 'bg-slate-700 text-white'
          }`}>
            {club.category}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveClub(club.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md transition-all ${
              isSaved
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
            title={isSaved ? 'Saved to Favorites' : 'Save Club'}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Club Logo Avatar */}
        <div className="absolute -bottom-5 left-5 w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-3xl shadow-md">
          {club.logo}
        </div>
      </div>

      {/* Club Content */}
      <div className="p-5 pt-8 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
              {club.name}
            </h3>
            <span className="text-xs font-semibold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {club.code}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-purple-50 text-[11px] text-slate-700">
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-pink-600" />
            <span><strong>{club.membersCount}</strong> Members</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span><strong>{club.upcomingEventsCount}</strong> Events</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-fuchsia-600" />
            <span><strong>{club.achievementsCount}</strong> Awards</span>
          </div>
        </div>

        {/* Advisor & Details Link */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
            Advisor: <span className="text-slate-800 font-semibold">{club.advisor.split('(')[0]}</span>
          </div>

          <button
            onClick={() => setSelectedClub(club)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold border border-pink-200 hover:border-pink-300 transition-all"
          >
            <span>View Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
