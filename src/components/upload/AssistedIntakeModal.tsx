"use client";

import React, { useState } from "react";

interface AssistedIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssistedIntakeModal({ isOpen, onClose, onSuccess }: AssistedIntakeModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [fandom, setFandom] = useState("");
  const [pairing, setPairing] = useState("");
  const [rating, setRating] = useState("Not Rated");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

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
      const response = await fetch("/api/assisted-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl,
          title: title.trim() || undefined,
          authorName: authorName.trim(),
          fandom: fandom.trim(),
          pairing: pairing.trim() || undefined,
          rating,
          summary: summary.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit assisted link.");
      }

      setSuccessMessage(
        "Link submitted to Administrator review queue. An archivist will inspect and verify the view-only link before publishing."
      );
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden my-8">
        <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">ℹ️</span>
            <h2 className="text-base font-bold tracking-wide">Assisted Public Intake (No Login Required)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-gray-800">
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

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 leading-normal">
            <strong>Assisted Pathway:</strong> Don&apos;t have an account or don&apos;t want to sign in? Submit your view-only Google Drive link here. Our team of volunteer administrators will review, verify read-only safety, and catalog the work into the public index.
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
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Work Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title if known"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Author Attribution <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author's pseudonym"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
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
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">Pairing (Optional)</label>
              <input
                type="text"
                value={pairing}
                onChange={(e) => setPairing(e.target.value)}
                placeholder="e.g. Vi/Caitlyn"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700">Notes for Admin Reviewers</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context or author permissions note..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-700 outline-hidden text-xs"
            />
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
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 rounded transition disabled:opacity-50"
            >
              {loading ? "Submitting to Queue..." : "Send to Review Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
