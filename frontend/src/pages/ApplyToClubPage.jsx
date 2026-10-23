import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Building2, AlertCircle, CheckCircle2, Info, Smartphone, Banknote } from "lucide-react";

const inputClass =
  "w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-amber-800/30 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all";

/**
 * ApplyToClubPage  ->  route: /clubs/:id/apply
 *
 * Name, roll and email come from the logged-in account and are only displayed.
 * The student writes a reason, optionally their experience and a phone number,
 * and (for clubs with a fee) chooses bKash or cash.
 */
export const ApplyToClubPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await apiFetch(`/api/clubs/${id}/membership-info`);
        setInfo(data);
        setPaymentMethod(data.club.accepts_bkash ? "bkash" : "cash");
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInfo();
  }, [id]);

  const roll = user ? user.email.split("@")[0] : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = { motivation, experience, phone };

      if (info.club.membership_fee > 0) {
        payload.payment_method = paymentMethod;
        if (paymentMethod === "bkash") payload.transaction_id = transactionId;
      }

      const data = await apiFetch(`/api/clubs/${id}/applications`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      navigate("/my-applications", { replace: true, state: { message: data.message } });
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass-panel p-8 rounded-2xl text-center text-stone-500 text-sm">Loading...</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
          <span>{loadError}</span>
        </div>
        <Link to="/clubs" className="inline-block mt-4 text-xs font-bold text-amber-800 hover:underline">
          Back to clubs
        </Link>
      </main>
    );
  }

  const { club, my_status: myStatus } = info;
  const fee = club.membership_fee;

  if (myStatus === "member" || myStatus === "pending") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl bg-white/90 border-amber-200/80 p-6 space-y-3 text-sm text-stone-700">
          <h1 className="text-lg font-extrabold font-serif text-stone-900">{club.name}</h1>
          {myStatus === "member" ? (
            <p>You are already a member of this club.</p>
          ) : (
            <p>You already have a pending application to this club. The club president will review it.</p>
          )}
          <Link
            to={myStatus === "member" ? "/my-clubs" : "/my-applications"}
            className="inline-block text-xs font-bold text-amber-800 hover:underline"
          >
            {myStatus === "member" ? "Go to My Clubs" : "Track my applications"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="glass-panel rounded-3xl border-amber-200/80 overflow-hidden bg-white/90">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-700 via-orange-800 to-amber-950 text-white flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-amber-300" />
          <div>
            <h1 className="text-lg font-extrabold font-sans">Apply to join {club.name}</h1>
            <p className="text-[11px] text-amber-200/80">
              {fee > 0 ? `Membership fee: ৳${fee}` : "No membership fee"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs text-stone-700">
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
              <span>{error}</span>
            </div>
          )}

          {/* Identity comes from the account, so it is shown but not editable */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Name</p>
              <p className="text-stone-900 font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Roll</p>
              <p className="text-stone-900 font-semibold">{roll}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">EduMail</p>
              <p className="text-stone-900 font-semibold truncate">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Why do you want to join? *</label>
            <textarea
              rows={4}
              required
              maxLength={1000}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Tell the club what interests you and what you hope to do."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Experience or skills (optional)</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Past projects, skills, anything relevant."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Mobile number (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01712345678"
              className={inputClass}
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Only the club president sees this, in case they need to reach you about your payment.
            </p>
          </div>

          {fee > 0 && (
            <div className="space-y-3 p-4 border border-amber-200 rounded-2xl bg-white">
              <p className="text-stone-800 font-bold text-sm">Membership fee: ৳{fee}</p>

              <div className="flex flex-col sm:flex-row gap-2">
                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                    paymentMethod === "bkash" ? "border-amber-600 bg-amber-50" : "border-amber-200"
                  } ${!club.accepts_bkash ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="bkash"
                    disabled={!club.accepts_bkash}
                    checked={paymentMethod === "bkash"}
                    onChange={() => setPaymentMethod("bkash")}
                  />
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span className="font-semibold">bKash</span>
                  {!club.accepts_bkash && <span className="text-[10px] text-stone-500">(not available)</span>}
                </label>

                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                    paymentMethod === "cash" ? "border-amber-600 bg-amber-50" : "border-amber-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                  />
                  <Banknote className="w-4 h-4 text-amber-700" />
                  <span className="font-semibold">Cash in person</span>
                </label>
              </div>

              {paymentMethod === "bkash" && (
                <div className="space-y-2">
                  <p className="leading-relaxed">
                    Send <strong>৳{fee}</strong> by bKash to <strong>{club.bkash_number}</strong>, then enter the
                    transaction ID (TrxID) from your bKash confirmation message.
                  </p>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g. 8N7A6D5EE1"
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                </div>
              )}

              {paymentMethod === "cash" && (
                <p className="leading-relaxed">
                  Pay <strong>৳{fee}</strong> in person to the club president. Your application stays pending
                  until they confirm they received it.
                </p>
              )}
            </div>
          )}

          <div className="flex items-start space-x-2 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
            <span>
              The club president reviews your application{fee > 0 ? " and verifies your payment" : ""}. You can
              follow the status on the My Applications page.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Sending..." : "Send Application"}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/clubs")}
              className="px-5 py-3 bg-white hover:bg-amber-50 text-stone-700 font-bold text-xs rounded-xl border border-amber-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};