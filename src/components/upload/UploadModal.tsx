"use client";

import React, { useState } from "react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [fandom, setFandom] = useState("");
  const [pairing, setPairing] = useState("");
  const [rating, setRating] = useState("General Audiences");
  const [wordCount, setWordCount] = useState<number | "">("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [canonicalAo3Url, setCanonicalAo3Url] = useState("");
  const [isOwnerMasked, setIsOwnerMasked] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch("/api/links/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl,
          title: title.trim() || undefined,
          authorName: authorName.trim(),
          fandom: fandom.trim(),
          pairing: pairing.trim() || undefined,
          rating,
          wordCount: typeof wordCount === "number" ? wordCount : 0,
          summary: summary.trim() || undefined,
          tags,
          canonicalAo3Url: canonicalAo3Url.trim() || undefined,
          isOwnerMasked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit work.");
      }

      setSuccessMessage("Work submitted successfully! It is now pending automated threat scanning.");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-gray-200 overflow-hidden my-8">
        <div className="bg-ao3-red text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide">Submit View-Only Fanwork (Contributor)</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-gray-800 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs leading-relaxed">
              <strong>Error:</strong> {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-xs leading-relaxed">
              {successMessage}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-normal">
            <strong>Zero-Download & Safety Rule:</strong> Only Google Drive/Docs links set to <em>&quot;Anyone with the link can view&quot;</em> are accepted. Editable links will be rejected to protect the author&apos;s content from vandalism.
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Google Drive View-Only Link <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              required
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red focus:border-ao3-red outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Work Title <span className="text-gray-400 font-normal">(Optional, uses file name if blank)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. To Build a Home"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Original Author <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. starlight_scribe"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Fandom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fandom}
                onChange={(e) => setFandom(e.target.value)}
                placeholder="e.g. Heartstopper, Arcane"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Pairing / Relationship</label>
              <input
                type="text"
                value={pairing}
                onChange={(e) => setPairing(e.target.value)}
                placeholder="e.g. Nick Nelson/Charlie Spring"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Content Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs bg-white"
              >
                <option value="General Audiences">General Audiences</option>
                <option value="Teen And Up Audiences">Teen And Up Audiences</option>
                <option value="Mature">Mature</option>
                <option value="Explicit">Explicit</option>
                <option value="Not Rated">Not Rated</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Approximate Word Count</label>
              <input
                type="number"
                min={0}
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value ? parseInt(e.target.value, 10) : "")}
                placeholder="e.g. 15000"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Fluff, Mutual Pining, Vacation, Found Family"
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Summary / Notes</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short description of the work..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Original AO3 Work Link (Optional)</label>
            <input
              type="url"
              value={canonicalAo3Url}
              onChange={(e) => setCanonicalAo3Url(e.target.value)}
              placeholder="https://archiveofourown.org/works/..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="maskOwner"
              checked={isOwnerMasked}
              onChange={(e) => setIsOwnerMasked(e.target.checked)}
              className="rounded text-ao3-red focus:ring-ao3-red"
            />
            <label htmlFor="maskOwner" className="text-gray-700 text-xs cursor-pointer">
              Mask Google Drive owner email address in public directory for privacy (e.g. vol***@gmail.com)
            </label>
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-ao3-red hover:bg-ao3-darkred rounded transition disabled:opacity-50"
            >
              {loading ? "Verifying & Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
