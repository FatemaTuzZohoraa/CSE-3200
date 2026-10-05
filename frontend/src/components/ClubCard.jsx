import React from "react";
import { Users, Calendar, Shield, ExternalLink, UserPlus, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

const categoryBadges = {
  Technology: "bg-fall-600 text-white",
  Robotics: "bg-amber-800 text-white",
  Career: "bg-amber-700 text-white",
  Cultural: "bg-fall-500 text-white",
  Sports: "bg-fall-800 text-white",
};

export const ClubCard = ({ club, onViewDetails }) => {
  const appCtx = useApp() || {};
  const joinedClubs = appCtx.joinedClubs || appCtx.savedClubIds || [];
  const joinClub = appCtx.joinClub || appCtx.toggleSaveClub;
  const leaveClub = appCtx.leaveClub || appCtx.toggleSaveClub;

  const isJoined = club && club.id ? joinedClubs.includes(club.id) : false;

  const handleToggleJoin = (e) => {
    e.stopPropagation();
    if (!club || !club.id) return;
    if (isJoined) {
      if (leaveClub) leaveClub(club.id);
    } else {
      if (joinClub) joinClub(club.id);
    }
  };

  return (
    <div
      onClick={() => onViewDetails && onViewDetails(club)}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col group border border-amber-900/10 bg-white/90 shadow-fall-sm hover:shadow-fall-md transition-all duration-300"
    >
      {/* Club Banner Image */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-amber-100">
        <img
          src={club.banner}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Badge & Code */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
              categoryBadges[club.category] || "bg-fall-600 text-white"
            }`}
          >
            {club.category}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/90 text-amber-950 backdrop-blur-md">
            {club.code}
          </span>
        </div>

        {/* Members Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[11px] font-bold flex items-center space-x-1">
          <Users className="w-3.5 h-3.5 text-amber-300" />
          <span>{club.membersCount || club.members_count || 0}</span>
        </div>

        {/* Club Logo Overlay */}
        <div className="absolute bottom-3 left-4 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-amber-900/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
            {club.logo && club.logo.startsWith('/') || club.logo && club.logo.startsWith('http') ? (
              <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
            ) : (
              <span>{club.logo || "🏛️"}</span>
            )}
          </div>
          <div className="text-white drop-shadow-md">
            <h3 className="font-extrabold text-base leading-snug line-clamp-1 group-hover:text-amber-200 transition-colors">
              {club.name}
            </h3>
            <p className="text-[11px] text-amber-100 font-medium">Est. {club.established || 2015}</p>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Description */}
        <p className="text-xs text-amber-900/80 leading-relaxed line-clamp-3">
          {club.description}
        </p>

        {/* Tags */}
        {club.tags && club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {club.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-amber-100/60 border border-amber-900/10 text-fall-700 text-[10px] font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Advisor Details */}
        <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-amber-950 font-medium truncate max-w-[65%]">
            <Shield className="w-3.5 h-3.5 text-fall-600 shrink-0" />
            <span className="truncate">Advisor: {club.advisor || club.advisor_name || "Faculty Board"}</span>
          </div>

          <div className="flex items-center space-x-1 text-amber-800 text-[11px]">
            <Calendar className="w-3 h-3 text-fall-600" />
            <span>{club.upcomingEventsCount || 0} Events</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => onViewDetails && onViewDetails(club)}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
          >
            <span>Details</span>
            <ExternalLink className="w-3.5 h-3.5 text-fall-600" />
          </button>

          <button
            onClick={handleToggleJoin}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1 shadow-sm ${
              isJoined
                ? "bg-amber-800 text-white hover:bg-amber-900"
                : "bg-fall-600 hover:bg-fall-700 text-white shadow-fall-600/20"
            }`}
          >
            {isJoined ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Joined</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
