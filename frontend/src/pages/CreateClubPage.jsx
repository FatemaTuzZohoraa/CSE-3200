import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Building2, CheckCircle2, AlertCircle, Image as ImageIcon, Info } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Technology",
  "Science",
  "Robotics",
  "Career",
  "Cultural",
  "Sports",
  "Academic",
  "Social"
];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "Technology",
  logo_url: "",
  advisor_name: "",
  advisor_email: "",
  advisor_department: ""
};

const inputClass =
  "w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-amber-800/30 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all";

/**
 * CreateClubPage  ->  route: /create-club
 * Styled with Fall Vibe aesthetic.
 */
export const CreateClubPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        logo_url: formData.logo_url || null,
        advisor_name: formData.advisor_name,
        advisor_email: formData.advisor_email || null,
        advisor_department: formData.advisor_department || null
      };

      await apiFetch("/api/clubs", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      navigate("/my-submissions", { replace: true });

    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="glass-panel rounded-3xl border-amber-200/80 overflow-hidden bg-white/90">

        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-700 via-orange-800 to-amber-950 text-white flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-amber-300" />
          <div>
            <h1 className="text-lg font-extrabold font-sans">Create New Club</h1>
            <p className="text-[11px] text-amber-200/80">Fill this in and send it to the DSW office for review.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs text-stone-700">

          {user && (
            <p className="text-stone-500">
              Submitting as <strong className="text-stone-800">{user.name}</strong> ({user.email}). You will
              automatically become this club's first member and president.
            </p>
          )}

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-orange-100/70 border border-orange-300 rounded-xl text-orange-950">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-700" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Club Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="e.g. RUET Astronomy Club"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-stone-700 font-semibold mb-1 block">Description *</label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="What is this club about, who can join, and what activities does it run?"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Category *</label>
              <select value={formData.category} onChange={handleChange("category")} className={inputClass}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-stone-700 font-semibold mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={handleChange("logo_url")}
                placeholder="https://example.com/logo.png"
                className={inputClass}
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Paste a public image link. File upload is not built yet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Advisor Name *</label>
              <input
                type="text"
                required
                value={formData.advisor_name}
                onChange={handleChange("advisor_name")}
                placeholder="e.g. Dr. Md. Example"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Advisor Email</label>
              <input
                type="email"
                value={formData.advisor_email}
                onChange={handleChange("advisor_email")}
                placeholder="advisor@ruet.ac.bd"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-stone-700 font-semibold mb-1 block">Advisor Department</label>
              <input
                type="text"
                value={formData.advisor_department}
                onChange={handleChange("advisor_department")}
                placeholder="e.g. Physics"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-start space-x-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-stone-600">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
            <span>
              Known limitation: the database has no file upload, and the logo can only be set by the
              person creating the club. Other club leaders cannot change the logo yet.
            </span>
          </div>

          <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-800" />
            <span>
              Your club starts as <strong>Pending</strong>. It becomes visible on the public Clubs
              page only after a DSW / admin approves it.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 hover:from-amber-600 hover:to-orange-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Club for Review"}
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