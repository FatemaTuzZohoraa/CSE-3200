import React from "react";
import { Link } from "react-router-dom";
import { Compass, Users, Trophy, Calendar, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#230B05] via-[#451A03] to-[#C85A32] text-white py-16 lg:py-24 rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-10 mb-8 shadow-2xl shadow-fall-900/40 border border-fall-500/30">
      
      {/* Decorative Autumn Glow Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fall-500/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Autumn Edition Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-200 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official RUET Student Activity Portal</span>
            </div>

            {/* Straight Typography Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Discover & Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400">RUET Clubs</span>
            </h1>

            <p className="text-amber-100/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
              Explore student societies, join upcoming workshops & hackathons, showcase national achievements, and turn your passions into real projects at Rajshahi University of Engineering & Technology.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#clubs"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-fall-500 to-amber-600 hover:from-fall-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-fall-900/50 hover:scale-105 transition-all flex items-center space-x-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Clubs</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/events"
                className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-sm backdrop-blur-md transition-all flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>Upcoming Events</span>
              </Link>
            </div>

            {/* Verification Note */}
            <div className="flex items-center justify-center lg:justify-start space-x-2 text-amber-200/80 text-xs pt-2">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Restricted & Verified for @student.ruet.ac.bd</span>
            </div>

          </div>

          {/* Right Statistics Box */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            
            <div className="bg-black/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center space-y-2 text-white shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
                <Compass className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">8</div>
              <div className="text-xs font-bold text-amber-100">Active Societies</div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center space-y-2 text-white shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">4,200+</div>
              <div className="text-xs font-bold text-amber-100">Student Members</div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center space-y-2 text-white shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">15+</div>
              <div className="text-xs font-bold text-amber-100">Annual Events</div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center space-y-2 text-white shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">40+</div>
              <div className="text-xs font-bold text-amber-100">National Wins</div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
