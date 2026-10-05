import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ClubCard } from "./ClubCard";
import { Search, Building2, Filter, Sparkles } from "lucide-react";

export const ClubDirectory = ({ onViewClub }) => {
  const { clubs } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Technology", "Robotics", "Cultural", "Career"];

  const filteredClubs = clubs.filter((club) => {
    const matchesCategory =
      selectedCategory === "All" ||
      club.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.tags && club.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="clubs" className="space-y-8">
      
      {/* Directory Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-amber-900/10 shadow-fall-sm">
        
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-fall-100 border border-fall-200 text-fall-700 text-xs font-extrabold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Official Student Societies</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
            Explore RUET Clubs & Communities
          </h2>
          <p className="text-xs sm:text-sm text-amber-900/80 leading-relaxed font-normal">
            Browse through technology, robotics, cultural, and career societies at RUET. Join clubs to participate in projects, workshops, and national competitions.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-amber-800/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs, tags, topics..."
            className="w-full bg-amber-50/60 border border-amber-900/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-amber-950 placeholder-amber-900/50 focus:outline-none focus:border-fall-500 focus:bg-white transition-all shadow-inner font-medium"
          />
        </div>

      </div>

      {/* Category Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-fall-600 text-white shadow-md shadow-fall-600/20"
                  : "bg-white/80 text-amber-950/80 hover:text-fall-600 hover:bg-amber-100/60 border border-amber-900/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count Badge */}
        <div className="text-xs font-bold text-amber-900/70 flex items-center space-x-1.5 bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-900/10">
          <Filter className="w-3.5 h-3.5 text-fall-600" />
          <span>Showing <strong>{filteredClubs.length}</strong> of {clubs.length} Clubs</span>
        </div>

      </div>

      {/* Clubs Card Grid */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-3xl border border-amber-900/10 space-y-3">
          <Building2 className="w-12 h-12 text-amber-800/40 mx-auto" />
          <h3 className="text-base font-bold text-amber-950">No clubs found</h3>
          <p className="text-xs text-amber-900/70 max-w-sm mx-auto">
            Try searching for a different keyword or select another category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="px-4 py-2 rounded-xl bg-fall-600 text-white font-bold text-xs shadow-md"
          >
            Reset Search Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onViewDetails={(selected) => onViewClub && onViewClub(selected)}
            />
          ))}
        </div>
      )}

    </section>
  );
};
