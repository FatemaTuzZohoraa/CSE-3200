import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { X, Calendar, MapPin, Clock, Users, Lock, Globe, CheckCircle2, AlertTriangle, Info } from 'lucide-react';


const inputClass =
  'w-full mt-1 bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-500';
const primaryBtn =
  'w-full py-2.5 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold rounded-xl shadow-md text-xs transition-all disabled:opacity-60';

// Defined OUTSIDE the modal so typing doesn't remount it and lose focus.
const PaymentFields = ({ event, method, setMethod, trxId, setTrxId }) => {
  const bkashNumber = event.organizer?.bkash_number;

  return (
    <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-3">
      <p className="text-[11px] text-stone-700">
        Fee: <strong className="text-amber-900">{event.fee} BDT</strong>
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'bkash', label: 'bKash', disabled: !bkashNumber },
          { id: 'cash', label: 'Cash', disabled: false }
        ].map((m) => (
          <button
            type="button"
            key={m.id}
            disabled={m.disabled}
            onClick={() => setMethod(m.id)}
            className={`p-2.5 rounded-xl border font-bold text-xs transition-all disabled:opacity-40 ${
              method === m.id ? 'border-amber-600 bg-amber-100/80 text-amber-950' : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            {m.label}
            {m.disabled && ' (not accepted)'}
          </button>
        ))}
      </div>

      {method === 'bkash' ? (
        <>
          <p className="text-[11px] text-stone-700">
            Send <strong>{event.fee} BDT</strong> to bKash number{' '}
            <strong className="font-mono text-stone-900">{bkashNumber}</strong>, then enter the transaction ID below.
          </p>
          <div>
            <label className="text-[11px] text-stone-600">bKash Transaction ID</label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. 8N7A6D5EE1"
              className={inputClass}
            />
          </div>
        </>
      ) : (
        <p className="text-[11px] text-stone-700">
          Pay cash to the club president. Your seat is confirmed once they receive it.
        </p>
      )}

      <p className="text-[10px] text-stone-500 flex items-start gap-1">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>A transaction ID is not proof of payment. The club president checks it before confirming your seat.</span>
      </p>
    </div>
  );
};

export const EventRegisterModal = () => {
  const { selectedEvent, setSelectedEvent, isRegisterModalOpen, setIsRegisterModalOpen, events, reloadEvents } = useApp();

  const [method, setMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [myReg, setMyReg] = useState(null); // my registration row (has the payment status and reject reason)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMyReg = async (eventId) => {
    try {
      const data = await apiFetch('/api/events/my/registrations');
      setMyReg((data.registrations || []).find((r) => String(r.event_id) === String(eventId)) || null);
    } catch {
      setMyReg(null);
    }
  };

  useEffect(() => {
    if (!isRegisterModalOpen || !selectedEvent) return;
    setError('');
    setNotice('');
    setTrxId('');
    setMethod('bkash');
    loadMyReg(selectedEvent.id);
  }, [isRegisterModalOpen, selectedEvent?.id]);

  if (!isRegisterModalOpen || !selectedEvent) return null;

  // The list reloads after every action, so always show the freshest copy.
  const event = events.find((e) => String(e.id) === String(selectedEvent.id)) || selectedEvent;

  const closeModal = () => {
    setIsRegisterModalOpen(false);
    setSelectedEvent(null);
  };

  const effectiveMethod = event.organizer?.bkash_number ? method : 'cash';

  const paymentBody = () => ({
    payment_method: effectiveMethod,
    transaction_id: effectiveMethod === 'bkash' ? trxId : undefined
  });

  const run = async (path, body) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await apiFetch(`/api/events/${event.id}${path}`, {
        method: 'POST',
        body: JSON.stringify(body || {})
      });
      setNotice(data.message);
      setTrxId('');
      await reloadEvents();
      await loadMyReg(event.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    run('/register', event.isPaid ? paymentBody() : {});
  };

  const handleResubmit = (e) => {
    e.preventDefault();
    run('/payment', paymentBody());
  };

  const handleCancel = () => {
    if (window.confirm('Cancel your registration for this event?')) run('/cancel-registration');
  };

  const status = event.myStatus;
  const paymentStatus = myReg?.payment_status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF5EF] border border-amber-200/80 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="relative">
          <img src={event.banner} alt={event.title} className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF5EF] to-transparent" />
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 text-stone-700 hover:bg-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-6 relative space-y-5 text-xs text-stone-700 overflow-y-auto max-h-[75vh]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              {event.clubName}
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-1 font-serif">{event.title}</h3>
          </div>

          {/* Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-panel p-3 rounded-xl border-amber-200/60 bg-white/70 space-y-0.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold"><Calendar className="w-4 h-4" /> When</div>
              <p className="font-bold text-stone-900">{event.date}</p>
              <p className="text-stone-500">{event.time}</p>
            </div>
            <div className="glass-panel p-3 rounded-xl border-amber-200/60 bg-white/70 space-y-0.5">
              <div className="flex items-center gap-2 text-orange-800 font-bold"><MapPin className="w-4 h-4" /> Venue</div>
              <p className="font-bold text-stone-900">{event.venue}</p>
            </div>
            <div className="glass-panel p-3 rounded-xl border-amber-200/60 bg-white/70 space-y-0.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold"><Clock className="w-4 h-4" /> Register by</div>
              <p className="font-bold text-stone-900">{event.deadlineLabel}</p>
            </div>
            <div className="glass-panel p-3 rounded-xl border-amber-200/60 bg-white/70 space-y-0.5">
              <div className="flex items-center gap-2 text-orange-800 font-bold">
                {event.audience === 'members_only' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />} Who can join
              </div>
              <p className="font-bold text-stone-900">
                {event.audience === 'members_only' ? `Active members of ${event.clubName}` : 'All RUET students'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <strong>{event.registeredCount}</strong>
              {event.maxParticipants !== null ? ` / ${event.maxParticipants} seats taken` : ' registered (unlimited seats)'}
            </span>
            <span className="text-base font-extrabold text-stone-900 font-serif">
              {event.isPaid ? `${event.fee} BDT` : 'FREE'}
            </span>
          </div>

          {event.description && (
            <div>
              <h4 className="font-bold text-stone-900 text-sm mb-1 font-serif">About the event</h4>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3">{notice}</div>
          )}

          {/* ---------- Registration area: one branch per state ---------- */}

          {(status === 'registered' || status === 'attended') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4" />
                {status === 'attended' ? 'You attended this event.' : 'You are registered for this event.'}
              </p>
              {status === 'registered' && !paymentStatus?.includes('success') && (
                <button onClick={handleCancel} disabled={busy} className="text-[11px] font-bold text-red-700 hover:underline disabled:opacity-60">
                  Cancel my registration
                </button>
              )}
              {paymentStatus === 'success' && (
                <p className="text-[11px] text-emerald-800">
                  Your payment was confirmed. To cancel or get a refund, contact the club.
                </p>
              )}
            </div>
          )}

          {status === 'pending_payment' && paymentStatus === 'pending' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
              <p className="font-bold text-orange-900">Waiting for the club president to verify your payment.</p>
              <p className="text-[11px] text-orange-800">
                {myReg.payment_method === 'bkash' ? `bKash transaction: ${myReg.transaction_id}` : 'Cash payment'} - {event.fee} BDT
              </p>
              <button onClick={handleCancel} disabled={busy} className="text-[11px] font-bold text-red-700 hover:underline disabled:opacity-60">
                Cancel my registration
              </button>
            </div>
          )}

          {status === 'pending_payment' && paymentStatus === 'failed' && (
            <form onSubmit={handleResubmit} className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-800">
                <p className="font-bold">Your payment was rejected.</p>
                {myReg?.review_note && <p className="mt-1">Reason: {myReg.review_note}</p>}
              </div>
              <PaymentFields event={event} method={effectiveMethod} setMethod={setMethod} trxId={trxId} setTrxId={setTrxId} />
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? 'Sending...' : 'Send new payment details'}
              </button>
              <button type="button" onClick={handleCancel} disabled={busy} className="text-[11px] font-bold text-red-700 hover:underline">
                Cancel my registration
              </button>
            </form>
          )}

          {status !== 'registered' && status !== 'attended' && status !== 'pending_payment' && (
            event.canRegister ? (
              <form onSubmit={handleRegister} className="space-y-3">
                {event.isPaid && (
                  <PaymentFields event={event} method={effectiveMethod} setMethod={setMethod} trxId={trxId} setTrxId={setTrxId} />
                )}
                <button type="submit" disabled={busy} className={primaryBtn}>
                  {busy ? 'Please wait...' : event.isPaid ? 'Submit registration & payment' : 'Confirm free registration'}
                </button>
              </form>
            ) : (
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 text-stone-700 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{event.blockedReason || 'Registration is not available for you.'}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};