import React from "react";

const STYLES = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
  success: "bg-emerald-100 text-emerald-900 border-emerald-300",
  rejected: "bg-orange-100 text-orange-900 border-orange-300",
  failed: "bg-orange-100 text-orange-900 border-orange-300",
  cancelled: "bg-stone-100 text-stone-600 border-stone-300"
};

/** Small coloured pill. `label` overrides the text, `status` picks the colour. */
export const StatusBadge = ({ status, label }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${
      STYLES[status] || STYLES.cancelled
    }`}
  >
    {label || status}
  </span>
);

export const PAYMENT_LABELS = {
  pending: "Payment pending",
  success: "Payment confirmed",
  failed: "Payment not confirmed"
};