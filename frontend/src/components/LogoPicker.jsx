import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB, same limit as the backend

/**
 * LogoPicker
 *
 * A file input with a live preview. It only holds the chosen File and hands it
 * to the parent through onChange; the parent sends it with the form.
 * These checks are for friendliness only. The backend checks everything again.
 *
 * The preview is wide and uses object-cover, the same way the club card banner
 * shows the image, so the preview matches the result.
 */
export const LogoPicker = ({ file, onChange }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  // Make a temporary local URL so the chosen image can be shown before upload,
  // and release it when the file changes or the component goes away.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) => {
    const picked = e.target.files && e.target.files[0];
    e.target.value = ""; // lets the user pick the same file again after removing it

    if (!picked) return;

    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Please choose a PNG, JPG or WEBP image.");
      return;
    }

    if (picked.size > MAX_BYTES) {
      setError("The image must be 2 MB or smaller.");
      return;
    }

    setError("");
    onChange(picked);
  };

  const handleRemove = () => {
    setError("");
    onChange(null);
  };

  return (
    <div>
      <label className="text-stone-700 font-semibold mb-1 block text-xs">
        Club Logo / Banner Image <span className="font-normal text-stone-500">(optional)</span>
      </label>

      <div className="space-y-2">
        <div className="w-full max-w-xs h-24 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-amber-700/60" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current && inputRef.current.click()}
            className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition-colors"
          >
            {file ? "Change image" : "Choose image"}
          </button>

          {file && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[11px] text-stone-500">
          PNG, JPG or WEBP, up to 2 MB. Wide images (about 3:1, like 1200×400) look best on the club card.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
};