"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [rating, setRating] = useState<
    "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit" | "Not Rated"
  >("Not Rated");
  const [wordCount, setWordCount] = useState<number | "">("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [canonicalSourceUrl, setCanonicalSourceUrl] = useState("");
  const [isOwnerMasked, setIsOwnerMasked] = useState(true);
  const [notes, setNotes] = useState("");

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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
      const parsedWordCount = typeof wordCount === "number" ? wordCount : 0;

      const response = await fetch("/api/assisted-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: driveUrl.trim(),
          title: title.trim() || undefined,
          authorName: authorName.trim() || undefined,
          fandom: fandom.trim() || undefined,
          pairing: pairing.trim() || undefined,
          rating,
          wordCount: parsedWordCount || undefined,
          summary: summary.trim() || undefined,
          tags,
          canonicalSourceUrl: canonicalSourceUrl.trim() || undefined,
          isOwnerMasked,
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark my-8">
        <div className="bg-brand-trunk text-white px-5 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-bold">ℹ️</span>
            <h2 className="text-base font-bold tracking-wide">
              Assisted Public Intake (No Login Required)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-gray-800 dark:text-gray-200">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded text-xs leading-relaxed">
              <strong>Error:</strong> {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 rounded text-xs leading-relaxed">
              {successMessage}
            </div>
          )}

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded text-[11px] text-blue-900 dark:text-blue-200 leading-normal">
            <strong>Assisted Pathway:</strong> Don&apos;t have an account or don&apos;t want to sign in? Submit your view-only Google Drive link here. Our team of volunteer administrators will review, verify read-only safety, and catalog the work into the public index.
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Google Drive View-Only Link <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              required
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs font-mono"
            />
          </div>

          {/* Expandable Sub-Details Section (Mirrors User Contribute UploadModal) */}
          <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden bg-canvas-light/50 dark:bg-canvas-dark/50">
            <button
              type="button"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-brand-trunk dark:text-brand-light font-mono text-sm">
                  {detailsExpanded ? "▼" : "▶"}
                </span>
                <span>PROVIDE DETAILS (OPTIONAL)</span>
              </div>
              <span className="text-[10px] text-gray-400 font-normal">
                {detailsExpanded ? "Click to collapse" : "Click to specify title, author, fandom, or tags"}
              </span>
            </button>

            {detailsExpanded && (
              <div className="p-4 space-y-3.5 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Work Title <span className="text-gray-400 font-normal">(Optional, uses folder/file name if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. To Build a Home"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Original Author <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. starlight_scribe"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Fandom <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={fandom}
                      onChange={(e) => setFandom(e.target.value)}
                      placeholder="e.g. Heartstopper, Arcane"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Pairing / Relationship <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={pairing}
                      onChange={(e) => setPairing(e.target.value)}
                      placeholder="e.g. Nick Nelson/Charlie Spring"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Content Rating</label>
                    <select
                      value={rating}
                      onChange={(e) =>
                        setRating(
                          e.target.value as
                            | "General Audiences"
                            | "Teen And Up Audiences"
                            | "Mature"
                            | "Explicit"
                            | "Not Rated"
                        )
                      }
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    >
                      <option value="General Audiences">General Audiences</option>
                      <option value="Teen And Up Audiences">Teen And Up Audiences</option>
                      <option value="Mature">Mature</option>
                      <option value="Explicit">Explicit</option>
                      <option value="Not Rated">Not Rated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Approximate Word Count</label>
                    <input
                      type="number"
                      min={0}
                      value={wordCount}
                      onChange={(e) => setWordCount(e.target.value ? parseInt(e.target.value, 10) : "")}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Fluff, Mutual Pining, Vacation, Found Family"
                    className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Summary / Notes</label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short description of the work or folder contents..."
                    className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Original Source Work Link (Optional)</label>
                  <input
                    type="url"
                    value={canonicalSourceUrl}
                    onChange={(e) => setCanonicalSourceUrl(e.target.value)}
                    placeholder="https://example.com/works/..."
                    className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Notes for Admin Reviewers <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context or author permissions note..."
              className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="assistedMaskOwner"
              checked={isOwnerMasked}
              onChange={(e) => setIsOwnerMasked(e.target.checked)}
              className="rounded text-brand-trunk focus:ring-brand-trunk"
            />
            <label htmlFor="assistedMaskOwner" className="text-gray-700 dark:text-gray-300 text-xs cursor-pointer">
              Mask Google Drive owner email address in public directory for privacy (e.g. vol***@gmail.com)
            </label>
          </div>

          <div className="pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark rounded border border-border-light dark:border-border-dark transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-trunk hover:bg-brand-bark rounded shadow-xs transition disabled:opacity-50"
            >
              {loading ? "Submitting to Queue..." : "Send to Review Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
