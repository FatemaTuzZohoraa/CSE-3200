import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Building2, X, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";

const CATEGORY_OPTIONS = ["Technology", "Science", "Robotics", "Career", "Cultural", "Sports", "Academic", "Social"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "Technology",
  logo_url: "",
  advisor_name: "",
  advisor_email: "",
  advisor_department: ""
};

/**
 * CreateClubModal
 * Sends ONLY club details to POST /api/clubs.
 *
 * There is no user_id, status, president_id or role field in this form, on
 * purpose. The server decides who the creator is and sets the status to pending.
 */
export const CreateClubModal = ({ isOpen, onClose, onClubCreated }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // Send the plain form fields. Empty optional ones become null so the
      // backend stores NULL instead of an empty string.
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        logo_url: formData.logo_url || null,
        advisor_name: formData.advisor_name,
        advisor_email: formData.advisor_email || null,
        advisor_department: formData.advisor_department || null
      };

      const data = await apiFetch("/api/clubs", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSuccessMessage(data.message);
      setFormData(EMPTY_FORM);
      onClubCreated?.();

      // Let the student read the confirmation before the form resets.
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 3500);

    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-pink-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">

        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-pink-600" />
            <h3 className="text-base font-bold text-slate-900">Create New Club</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">

          {user && (
            <p className="text-slate-500">
              Submitting as <strong className="text-slate-800">{user.name}</strong> ({user.email}). You will
              automatically become this club's first member and president.
            </p>
          )}

          {error && (
            <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold mb-1 block">Club Name *</label>
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
            <label className="text-slate-700 font-semibold mb-1 block">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={handleChange("description")}
              placeholder="What is this club about, who can join, and what activities does it run?"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Category *</label>
              <select value={formData.category} onChange={handleChange("category")} className={inputClass}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={handleChange("logo_url")}
                placeholder="https://example.com/logo.png"
                className={inputClass}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Paste a public image link. There is no file upload system in this project yet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Advisor Name *</label>
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
              <label className="text-slate-700 font-semibold mb-1 block">Advisor Email</label>
              <input
                type="email"
                value={formData.advisor_email}
                onChange={handleChange("advisor_email")}
                placeholder="advisor@ruet.ac.bd"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold mb-1 block">Advisor Department</label>
              <input
                type="text"
                value={formData.advisor_department}
                onChange={handleChange("advisor_department")}
                placeholder="e.g. Physics"
                className={inputClass}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            Your club starts as <strong>Pending</strong>. It becomes visible on the public Clubs page only after a
            DSW / admin approves it.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Club for Review"}
          </button>
        </form>
      </div>
    </div>
  );
};