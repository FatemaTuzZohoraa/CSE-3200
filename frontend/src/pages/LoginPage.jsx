import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, GraduationCap } from "lucide-react";
import { AuthLayout, AuthAlert, AuthSubmitButton, inputClass } from "../components/AuthLayout";

/**
 * LoginPage  ->  route: /login
 * Full page styled with Fall Vibe aesthetic.
 */
export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      if (user.role === "admin" && redirectTo === "/") {
        navigate("/admin/review", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your RUET EduMail to manage your clubs."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-bold text-amber-800 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthAlert>{error}</AuthAlert>

        <div>
          <label className="text-stone-700 font-semibold mb-1 block text-xs">RUET EduMail</label>
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
        </div>

        <div>
          <label className="text-stone-700 font-semibold mb-1 block text-xs">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your account password"
            className={inputClass}
          />
        </div>

        <AuthSubmitButton isSubmitting={isSubmitting}>
          <LogIn className="w-4 h-4" />
          <span>Log In</span>
        </AuthSubmitButton>

        <p className="text-[11px] text-stone-600 bg-amber-100/50 border border-amber-200/80 rounded-xl p-3 leading-relaxed">
          Club leaders and students log in here with the same form. University admin
          accounts are created by the DSW office and use this page too.
        </p>
      </form>
    </AuthLayout>
  );
};