import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, MapPin, QrCode, CheckCircle2, ArrowRight, Download } from 'lucide-react';

export const EventRegisterModal = () => {
  const { selectedEvent, setSelectedEvent, isRegisterModalOpen, setIsRegisterModalOpen, registerForEvent, userRegistrations, currentUser } = useApp();

  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'ticket'

  if (!isRegisterModalOpen || !selectedEvent) return null;

  const isAlreadyRegistered = userRegistrations.includes(selectedEvent.id);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const generatedTicketId = `RUET-${selectedEvent.code || 'TKT'}-${Math.floor(100000 + Math.random() * 900000)}`;
    registerForEvent(selectedEvent.id, { ticketId: generatedTicketId });
    setStep('ticket');
  };

  const closeModal = () => {
    setIsRegisterModalOpen(false);
    setSelectedEvent(null);
    setStep('details');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col">
        
        {/* Header */}
        <div className="relative p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              🎟️
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {selectedEvent.clubName}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedEvent.title}</h3>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-full bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700 overflow-y-auto max-h-[75vh]">
          
          {/* STEP: ALREADY REGISTERED OR SHOW TICKET */}
          {(isAlreadyRegistered || step === 'ticket') ? (
            <div className="space-y-6 text-center">
              
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Official Digital Ticket</span>
              </div>

              {/* QR Ticket Preview Card */}
              <div className="max-w-sm mx-auto bg-gradient-to-b from-slate-50 to-white border-2 border-cyan-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
                
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-extrabold text-sm text-amber-700">RUET EVENT TICKET</span>
                  <span className="font-mono text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    #RUET-2026-9081
                  </span>
                </div>

                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-base text-slate-900">{selectedEvent.title}</h4>
                  <p className="text-xs text-slate-500">{selectedEvent.clubName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-slate-100 p-3 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <p className="text-slate-500">Attendee:</p>
                    <p className="font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-slate-500 font-mono">{currentUser.studentId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Venue & Time:</p>
                    <p className="font-semibold text-cyan-700">{selectedEvent.venue.split(',')[0]}</p>
                    <p className="text-slate-500">{selectedEvent.date}</p>
                  </div>
                </div>

                {/* Generated QR Code Graphic */}
                <div className="p-4 bg-white rounded-xl max-w-[160px] mx-auto shadow-md border border-slate-200 flex flex-col items-center">
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <span className="text-[9px] font-mono text-slate-500 font-bold mt-1">SCAN AT ENTRANCE</span>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  Show this QR code at the event entrance for automated attendance verification.
                </p>

              </div>

              <button
                onClick={() => alert('Ticket saved to downloads as PDF!')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Ticket PDF</span>
              </button>

            </div>
          ) : step === 'details' ? (
            
            /* STEP: EVENT DETAILS & CONFIRMATION */
            <div className="space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-panel p-3.5 rounded-xl border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center space-x-2 text-rose-600 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>Date & Time</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedEvent.date}</p>
                  <p className="text-xs text-slate-500">{selectedEvent.time}</p>
                </div>

                <div className="glass-panel p-3.5 rounded-xl border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center space-x-2 text-amber-600 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Venue Location</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedEvent.venue}</p>
                  <p className="text-xs text-slate-500">RUET Campus</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">About the Event</h4>
                <p className="text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Registration Fee Summary */}
              <div className="glass-panel p-4 rounded-xl border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Registration Fee:</span>
                  <p className="text-lg font-extrabold text-slate-900">
                    {selectedEvent.fee === 0 ? 'FREE REGISTRATION' : `${selectedEvent.fee} BDT`}
                  </p>
                </div>
                <button
                  onClick={() => setStep(selectedEvent.fee === 0 ? 'ticket' : 'payment')}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md flex items-center space-x-2 text-xs"
                >
                  <span>{selectedEvent.fee === 0 ? 'Confirm Free Ticket' : 'Proceed to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          ) : (

            /* STEP: PAYMENT SIMULATION */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Total Ticket Fee:</span>
                  <span className="font-bold text-amber-700 text-sm">{selectedEvent.fee} BDT</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select payment gateway method to complete your ticket booking.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'bkash', name: 'bKash', color: 'border-pink-500 bg-pink-50 text-pink-700', icon: '💗' },
                  { id: 'nagad', name: 'Nagad', color: 'border-orange-500 bg-orange-50 text-orange-700', icon: '🧡' },
                  { id: 'card', name: 'Card / Bank', color: 'border-cyan-500 bg-cyan-50 text-cyan-700', icon: '💳' }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                      paymentMethod === m.id ? m.color : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-xs">{m.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Banking Instructions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[11px] text-slate-700">
                  Send <strong className="text-amber-700">{selectedEvent.fee} BDT</strong> to Merchant Number: <strong className="text-slate-900 font-mono">01700-RUET-CLUB</strong> via {paymentMethod.toUpperCase()} (Make Payment).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600">Your Sender Mobile No.</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01712345678"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600">Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. BK9823XLS1"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="w-1/3 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md text-xs"
                >
                  Verify Payment & Issue Ticket
                </button>
              </div>

            </form>

          )}

        </div>

      </div>
    </div>
  );
};
