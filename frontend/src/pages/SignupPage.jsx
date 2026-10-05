import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, GraduationCap, ShieldCheck } from "lucide-react";
import { AuthLayout, AuthAlert, AuthSubmitButton, inputClass } from "../components/AuthLayout";

/**
 * SignupPage  ->  route: /signup
 * Styled with Fall Vibe aesthetic.
 */
export const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("The two passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await register(name, email, password);

      setSuccessMessage(data.message);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Registration is open to RUET students with an EduMail address."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-bold text-amber-800 hover:underline">
            Log in instead
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthAlert>{error}</AuthAlert>
        <AuthAlert tone="success">{successMessage}</AuthAlert>

        <div>
          <label className="text-stone-700 font-semibold mb-1 block text-xs">Full Name *</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fatema Tuz Zohora"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-stone-700 font-semibold mb-1 block text-xs">RUET EduMail *</label>
          <div className="relative">
            <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-700" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="2203032@student.ruet.ac.bd"
              className={`${inputClass} pl-9`}
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Only <span className="font-mono font-semibold">@student.ruet.ac.bd</span> addresses can register.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-stone-700 font-semibold mb-1 block text-xs">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-700 font-semibold mb-1 block text-xs">Confirm Password *</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className={inputClass}
            />
          </div>
        </div>

        <AuthSubmitButton isSubmitting={isSubmitting}>
          <UserPlus className="w-4 h-4" />
          <span>Create Account</span>
        </AuthSubmitButton>

        <div className="flex items-start space-x-2 p-3 bg-amber-100/60 border border-amber-300 rounded-xl text-amber-950 text-[11px] leading-relaxed">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
          <span>
            New accounts start as <strong>student</strong>. Submitting a club for approval is
            done from your dashboard after you log in.
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};