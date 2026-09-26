import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Award, PlusCircle, QrCode } from 'lucide-react';

export const RoleDashboard = () => {
  const { currentRoleKey, currentUser, userRegistrations, events, clubs, setSelectedEvent, setIsRegisterModalOpen, setIsCreateEventModalOpen } = useApp();

  const registeredEventObjects = events.filter((e) => userRegistrations.includes(e.id));

  return (
    <div className="space-y-8 py-4">
      
      {/* Profile Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-500/60 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono text-xs border border-cyan-200">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">{currentUser.roleTitle}</p>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.dept} • {currentUser.series} • ID: <span className="font-mono text-cyan-700 font-bold">{currentUser.studentId}</span>
            </p>
          </div>
        </div>

        {/* Quick Role Actions */}
        {(currentRoleKey === 'leader' || currentRoleKey === 'admin') && (
          <button
            onClick={() => setIsCreateEventModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Club Event</span>
          </button>
        )}
      </div>

      {/* STUDENT PORTAL VIEW */}
      {currentRoleKey === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* My Registered Events & Tickets */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>My Registered Events & Active QR Tickets ({registeredEventObjects.length})</span>
            </h3>

            {registeredEventObjects.length === 0 ? (
              <div className="glass-panel p-6 rounded-xl border-slate-200 text-center text-slate-500">
                You haven't registered for any events yet. Explore events to book your ticket!
              </div>
            ) : (
              <div className="space-y-3">
                {registeredEventObjects.map((evt) => (
                  <div key={evt.id} className="glass-panel p-4 rounded-xl border-slate-200 flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-cyan-700 font-bold uppercase">{evt.clubName}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                      <p className="text-xs text-slate-500">{evt.date} • {evt.venue}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEvent(evt);
                        setIsRegisterModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-cyan-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Ticket</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Certificates & Stats */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>My Verified Certificates</span>
            </h3>

            <div className="space-y-3">
              {currentUser.certificates.map((cert) => (
                <div key={cert.id} className="glass-panel p-3.5 rounded-xl border-slate-200 space-y-1 bg-white">
                  <span className="text-[10px] font-mono text-cyan-700 font-bold">{cert.id}</span>
                  <h5 className="font-bold text-xs text-slate-900">{cert.title}</h5>
                  <p className="text-[10px] text-slate-500">{cert.date} • Issued by DSW RUET</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CLUB LEADER MANAGEMENT PORTAL */}
      {currentRoleKey === 'leader' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-medium">Managed Club</span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">{currentUser.managedClubName}</h4>
              <p className="text-xs text-cyan-700 font-semibold mt-1">420 Active Members</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-medium">Total Ticket Registrations</span>
              <h4 className="text-2xl font-extrabold text-amber-600 mt-1">142 Students</h4>
              <p className="text-xs text-slate-500 mt-1">For Cyber Treasure Hunt 2.0</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-medium">Sub-Executive Applications</span>
              <h4 className="text-2xl font-extrabold text-rose-600 mt-1">18 Pending</h4>
              <p className="text-xs text-slate-500 mt-1">Series 22 & 23 Applicants</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-200 space-y-4 bg-white">
            <h4 className="font-bold text-sm text-slate-900">Event Attendance & Member Management</h4>
            <div className="space-y-2">
              {[
                { name: 'Fatema Tuz Zohora', id: '2203032', dept: 'CSE 22', status: 'Payment Verified', ticket: 'RCC-9011' },
                { name: 'Nafis Ahmed', id: '2203042', dept: 'CSE 22', status: 'Payment Verified', ticket: 'RCC-9012' },
                { name: 'Sumaiya Akter', id: '2201015', dept: 'EEE 22', status: 'Pending Review', ticket: 'RCC-9013' }
              ].map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span> ({m.dept}) • Ticket #{m.ticket}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'Payment Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL */}
      {currentRoleKey === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500">Total Registered Clubs</span>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{clubs.length} Clubs</h4>
            </div>
            <div className="glass-panel p-4 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500">Total Active Events</span>
              <h4 className="text-2xl font-extrabold text-cyan-600 mt-1">{events.length} Events</h4>
            </div>
            <div className="glass-panel p-4 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500">Campus Participation</span>
              <h4 className="text-2xl font-extrabold text-rose-600 mt-1">3,900 Students</h4>
            </div>
            <div className="glass-panel p-4 rounded-2xl border-slate-200 bg-white">
              <span className="text-xs text-slate-500">DSW Budget Allocated</span>
              <h4 className="text-2xl font-extrabold text-amber-600 mt-1">1.2M BDT</h4>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-200 space-y-4 bg-white">
            <h4 className="font-bold text-sm text-slate-900">University Administration Approvals</h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-900">Event Budget Approval Request:</span> Cyber Treasure Hunt 2.0
                <p className="text-slate-500 mt-0.5">Submitted by RUET Cybersecurity Club • Budget: 25,000 BDT</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => alert('Approved by DSW Admin!')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs">
                  Approve
                </button>
                <button onClick={() => alert('Rejected')} className="px-3 py-1.5 bg-rose-100 text-rose-700 font-bold rounded-lg text-xs border border-rose-200">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
