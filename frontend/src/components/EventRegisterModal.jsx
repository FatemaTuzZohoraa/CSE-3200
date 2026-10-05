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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col">

        {/* Header */}
        <div className="relative p-6 bg-amber-100/50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
              🎟️
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                {selectedEvent.clubName}
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-0.5 font-serif">{selectedEvent.title}</h3>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-full bg-amber-200/60 text-stone-700 hover:bg-amber-300/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-stone-700 overflow-y-auto max-h-[75vh]">

          {/* STEP: ALREADY REGISTERED OR SHOW TICKET */}
          {(isAlreadyRegistered || step === 'ticket') ? (
            <div className="space-y-6 text-center">

              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-800" />
                <span>Verified Official Digital Ticket</span>
              </div>

              {/* QR Ticket Preview Card */}
              <div className="max-w-sm mx-auto bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400/60 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">

                <div className="flex justify-between items-center border-b border-amber-200 pb-3">
                  <span className="font-extrabold text-sm text-amber-900 font-serif">RUET EVENT TICKET</span>
                  <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    #RUET-2026-9081
                  </span>
                </div>

                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-base text-stone-900 font-serif">{selectedEvent.title}</h4>
                  <p className="text-xs text-stone-500">{selectedEvent.clubName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-[11px]">
                  <div>
                    <p className="text-stone-500">Attendee:</p>
                    <p className="font-bold text-stone-900">{currentUser.name}</p>
                    <p className="text-stone-500 font-mono">{currentUser.studentId}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Venue & Time:</p>
                    <p className="font-semibold text-amber-800">{selectedEvent.venue.split(',')[0]}</p>
                    <p className="text-stone-500">{selectedEvent.date}</p>
                  </div>
                </div>

                {/* Generated QR Code Graphic */}
                <div className="p-4 bg-white rounded-xl max-w-[160px] mx-auto shadow-md border border-amber-200/80 flex flex-col items-center">
                  <QrCode className="w-32 h-32 text-stone-900" />
                  <span className="text-[9px] font-mono text-stone-500 font-bold mt-1">SCAN AT ENTRANCE</span>
                </div>

                <p className="text-[10px] text-stone-500 italic">
                  Show this QR code at the event entrance for automated attendance verification.
                </p>

              </div>

              <button
                onClick={() => alert('Ticket saved to downloads as PDF!')}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-800 to-orange-800 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center space-x-2 transition-all"
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
                <div className="glass-panel p-3.5 rounded-xl border-amber-200/60 bg-white/70 space-y-1">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>Date & Time</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900">{selectedEvent.date}</p>
                  <p className="text-xs text-stone-500">{selectedEvent.time}</p>
                </div>

                <div className="glass-panel p-3.5 rounded-xl border-amber-200/60 bg-white/70 space-y-1">
                  <div className="flex items-center space-x-2 text-orange-800 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>Venue Location</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900">{selectedEvent.venue}</p>
                  <p className="text-xs text-stone-500">RUET Campus</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-sm mb-1 font-serif">About the Event</h4>
                <p className="text-stone-600 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Registration Fee Summary */}
              <div className="glass-panel p-4 rounded-xl border-amber-200/60 bg-white/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500">Registration Fee:</span>
                  <p className="text-lg font-extrabold text-stone-900 font-serif">
                    {selectedEvent.fee === 0 ? 'FREE REGISTRATION' : `${selectedEvent.fee} BDT`}
                  </p>
                </div>
                <button
                  onClick={() => setStep(selectedEvent.fee === 0 ? 'ticket' : 'payment')}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold rounded-xl shadow-md flex items-center space-x-2 text-xs transition-all"
                >
                  <span>{selectedEvent.fee === 0 ? 'Confirm Free Ticket' : 'Proceed to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          ) : (

            /* STEP: PAYMENT SIMULATION */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">

              <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between text-xs text-stone-700">
                  <span>Total Ticket Fee:</span>
                  <span className="font-bold text-amber-900 text-sm font-mono">{selectedEvent.fee} BDT</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Select payment gateway method to complete your ticket booking.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'bkash', name: 'bKash', color: 'border-amber-600 bg-amber-100/80 text-amber-950', icon: '💗' },
                  { id: 'nagad', name: 'Nagad', color: 'border-orange-600 bg-orange-100/80 text-orange-950', icon: '🧡' },
                  { id: 'card', name: 'Card / Bank', color: 'border-amber-700 bg-amber-100/80 text-amber-950', icon: '💳' }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === m.id ? m.color : 'border-stone-200 bg-white text-stone-600'
                      }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-xs">{m.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Banking Instructions */}
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-3">
                <p className="text-[11px] text-stone-700">
                  Send <strong className="text-amber-900">{selectedEvent.fee} BDT</strong> to Merchant Number: <strong className="text-stone-900 font-mono">01700-RUET-CLUB</strong> via {paymentMethod.toUpperCase()} (Make Payment).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-600">Your Sender Mobile No.</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01712345678"
                      className="w-full mt-1 bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-600">Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. BK9823XLS1"
                      className="w-full mt-1 bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="w-1/3 py-2.5 bg-amber-200/60 text-stone-800 font-bold rounded-xl text-xs hover:bg-amber-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold rounded-xl shadow-md text-xs transition-all"
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
