import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Globe, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';

export const ClubDetailModal = () => {
  const { selectedClub, setSelectedClub, events, achievements } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [recruitmentSubmitted, setRecruitmentSubmitted] = useState(false);
  const [recruitingForm, setRecruitingForm] = useState({ name: '', dept: '', series: '', reason: '' });

  if (!selectedClub) return null;

  const clubEvents = events.filter((e) => e.clubId === selectedClub.id);
  const clubAchievements = achievements.filter((a) => a.clubId === selectedClub.id);

  const handleRecruitmentSubmit = (e) => {
    e.preventDefault();
    setRecruitmentSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Banner Header */}
        <div className="relative h-48 sm:h-56 bg-slate-100 shrink-0">
          <img
            src={selectedClub.banner}
            alt={selectedClub.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={() => {
              setSelectedClub(null);
              setRecruitmentSubmitted(false);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white transition-all z-20 shadow-sm border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Club Logo & Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-4xl shadow-md shrink-0">
              {selectedClub.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{selectedClub.name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 rounded font-bold">
                  {selectedClub.code}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium flex items-center space-x-3">
                <span>Category: <strong className="text-cyan-700">{selectedClub.category}</strong></span>
                <span>• Est. {selectedClub.established}</span>
                <span>• {selectedClub.membersCount} Members</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: `Events (${clubEvents.length})` },
            { id: 'achievements', label: `Achievements (${clubAchievements.length})` },
            { id: 'executives', label: 'Executive Committee' },
            { id: 'recruitment', label: 'Join / Recruitment' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3 px-3 border-b-2 transition-all ${
                activeSubTab === tab.id
                  ? 'border-cyan-600 text-cyan-700 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          
          {/* TAB: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">About {selectedClub.name}</h4>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                  {selectedClub.description}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClub.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-cyan-700 text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Advisor & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="glass-panel p-4 rounded-xl border-slate-200 bg-slate-50">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Faculty Advisor</h4>
                  <p className="text-sm font-semibold text-slate-900">{selectedClub.advisor}</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">Contact Details</h4>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{selectedClub.contactEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Globe className="w-3.5 h-3.5 text-rose-600" />
                    <a href={selectedClub.website} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
                      {selectedClub.website}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeSubTab === 'events' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Events organized by {selectedClub.name}</h4>
              {clubEvents.length === 0 ? (
                <p className="text-slate-500 italic">No events scheduled at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clubEvents.map((evt) => (
                    <div key={evt.id} className="glass-panel p-4 rounded-xl border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                          {evt.category}
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold">{evt.fee === 0 ? 'FREE' : `${evt.fee} BDT`}</span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900">{evt.title}</h5>
                      <p className="text-[11px] text-slate-500">{evt.date} • {evt.venue}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ACHIEVEMENTS */}
          {activeSubTab === 'achievements' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Milestones & Competition Wins</h4>
              {clubAchievements.length === 0 ? (
                <p className="text-slate-500 italic">No achievements recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {clubAchievements.map((ach) => (
                    <div key={ach.id} className="glass-panel p-4 rounded-xl border-slate-200 bg-white flex items-start space-x-3">
                      <div className="text-2xl p-2 rounded-xl bg-slate-100 border border-slate-200">{ach.icon}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-sm text-slate-900">{ach.title}</h5>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            {ach.rank}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-700 font-semibold mt-0.5">{ach.competition} • {ach.date}</p>
                        <p className="text-xs text-slate-600 mt-1">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EXECUTIVES */}
          {activeSubTab === 'executives' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Executive Board Members</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedClub.executives.map((exec) => (
                  <div key={exec.name} className="glass-panel p-4 rounded-xl border-slate-200 bg-white text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                      {exec.name.charAt(0)}
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm">{exec.name}</h5>
                    <p className="text-xs font-semibold text-cyan-700">{exec.role}</p>
                    <p className="text-[11px] text-slate-500">{exec.dept}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RECRUITMENT */}
          {activeSubTab === 'recruitment' && (
            <div className="space-y-4">
              {recruitmentSubmitted ? (
                <div className="glass-panel p-6 rounded-2xl border-emerald-300 text-center space-y-3 bg-emerald-50">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-bold text-slate-900">Application Submitted!</h4>
                  <p className="text-xs text-slate-600">
                    Thank you for applying to join <strong>{selectedClub.name}</strong>. The executive board will review your application and send interview schedules via your RUET email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRecruitmentSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    <span>Sub-Executive Member Application</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium">Full Name</label>
                      <input
                        type="text"
                        required
                        value={recruitingForm.name}
                        onChange={(e) => setRecruitingForm({ ...recruitingForm, name: e.target.value })}
                        placeholder="e.g. Fatema Tuz Zohora"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium">Department</label>
                      <input
                        type="text"
                        required
                        value={recruitingForm.dept}
                        onChange={(e) => setRecruitingForm({ ...recruitingForm, dept: e.target.value })}
                        placeholder="e.g. CSE / EEE / MTE"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-medium">Series / Year</label>
                      <input
                        type="text"
                        required
                        value={recruitingForm.series}
                        onChange={(e) => setRecruitingForm({ ...recruitingForm, series: e.target.value })}
                        placeholder="e.g. Series 22"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-medium">Why do you want to join {selectedClub.name}?</label>
                    <textarea
                      rows={3}
                      required
                      value={recruitingForm.reason}
                      onChange={(e) => setRecruitingForm({ ...recruitingForm, reason: e.target.value })}
                      placeholder="Describe your skills, past projects, or motivations..."
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Membership Application</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
