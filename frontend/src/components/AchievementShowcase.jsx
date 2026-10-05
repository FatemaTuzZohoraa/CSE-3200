import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Award, ExternalLink, Download } from 'lucide-react';

export const AchievementShowcase = () => {
  const { achievements, currentUser } = useApp();

  return (
    <div className="space-y-8 py-4">

      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border-amber-200/60 text-center relative overflow-hidden bg-white/90">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-bold mb-3">
          <Trophy className="w-4 h-4 text-amber-700" />
          <span>RUET Wall of Excellence</span>
        </div>

        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          National & International <span className="font-logo bg-gradient-to-r from-amber-700 via-orange-600 to-amber-900 bg-clip-text text-transparent italic">Achievements</span>
        </h2>

        <p className="text-stone-600 text-xs sm:text-sm max-w-2xl mx-auto mt-2">
          Celebrating top hackathon victories, autonomous robotics championships, debate honors, and cultural trophies achieved by RUET clubs worldwide.
        </p>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((ach) => (
          <div key={ach.id} className="glass-panel glass-panel-hover p-6 rounded-2xl border-stone-200 space-y-4 flex flex-col justify-between bg-white/90">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-4xl p-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
                  {ach.icon}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                  {ach.badge}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">{ach.clubName}</span>
                <h3 className="text-lg font-bold text-stone-900 mt-1 leading-snug font-serif">{ach.title}</h3>
                <p className="text-xs text-amber-800 font-semibold mt-1">{ach.rank} • {ach.competition}</p>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {ach.description}
              </p>
            </div>

            <div className="pt-3 border-t border-amber-100 flex justify-between items-center text-[11px] text-stone-500">
              <span>Achieved: <strong>{ach.date}</strong></span>
              <span className="text-amber-800 font-semibold cursor-pointer hover:underline flex items-center space-x-1">
                <span>View Certificate</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Verification & Certificate Demo */}
      <div className="glass-panel p-6 rounded-2xl border-amber-200/80 bg-gradient-to-r from-amber-100/40 via-white to-orange-50/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <Award className="w-5 h-5 text-amber-700" />
            <span>Digital Certificate Verification System</span>
          </div>
          <p className="text-xs text-stone-600 max-w-xl">
            All RUET event certificates feature tamper-proof digital signatures issued by the Director of Student Welfare (DSW). Verify or download your personal participation certificates.
          </p>
        </div>

        <button
          onClick={() => alert(`Showing ${currentUser.certificates.length} certificates for ${currentUser.name}`)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md shrink-0 flex items-center space-x-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>My Verified Certificates ({currentUser.certificates.length})</span>
        </button>
      </div>

    </div>
  );
};
