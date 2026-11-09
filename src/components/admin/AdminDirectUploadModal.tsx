"use client";

import React, { useState } from "react";
import { adminDirectUpload } from "@/lib/rbacService";
import { segmentDriveUrl } from "@/lib/urlSegmenter";

interface AdminDirectUploadModalProps {
  isOpen: boolean;
  adminDisplayName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminDirectUploadModal({
  isOpen,
  adminDisplayName,
  onClose,
  onSuccess,
}: AdminDirectUploadModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [confirmedViewOnly, setConfirmedViewOnly] = useState(false);
  const [isPriorVerified, setIsPriorVerified] = useState(false); // Default: Unchecked

  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [fandom, setFandom] = useState("");
  const [pairing, setPairing] = useState("");
  const [rating, setRating] = useState<
    "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit" | "Not Rated"
  >("General Audiences");
  const [wordCount, setWordCount] = useState<number | "">("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [driveOwnerEmail, setDriveOwnerEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const segments = segmentDriveUrl(driveUrl);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!segments.isValid) {
      setError(segments.errorMessage || "Please enter a valid Google Drive or Docs link.");
      return;
    }

    if (!confirmedViewOnly) {
      setError("Please confirm that the link is view-only and safe.");
      return;
    }

    if (!title.trim() || !authorName.trim() || !fandom.trim()) {
      setError("Title, Author Name, and Fandom are required.");
      return;
    }

    setLoading(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const parsedWordCount = typeof wordCount === "number" ? wordCount : 0;
      const canonicalUrl = segments.canonicalUrl;

      // Submit via rbacService adminDirectUpload
      adminDirectUpload({
        title: title.trim(),
        authorName: authorName.trim(),
        fandom: fandom.trim(),
        pairing: pairing.trim() || undefined,
        rating,
        wordCount: parsedWordCount,
        summary: summary.trim(),
        tags,
        rawDriveUrl: canonicalUrl,
        driveOwnerEmail: driveOwnerEmail.trim() || undefined,
        isPriorVerified, // If true => Approved immediately; If false => Under Verification
        uploadedBy: adminDisplayName || "admin",
        uploadedByRole: "admin",
      });

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to upload fanwork as admin.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-upload-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h3
                id="admin-upload-title"
                className="text-base font-bold text-gray-900 dark:text-gray-100"
              >
                Administrator Direct Upload
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Direct ingest with priority triage routing or prior verification bypass.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1 rounded-md"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Segmented Drive Link Input */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-800 dark:text-gray-200">
              Google Drive / Docs Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/1BxyZ9qK8LmN0.../view?usp=sharing"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk font-mono text-xs"
            />

            {/* Segmented Safety Visualizer */}
            {driveUrl && (
              <div className="p-3 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark space-y-2">
                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  Deconstructed Link Architecture (Defanged & Verified):
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {segments.protocolDomain || "https://drive.google.com/"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {segments.resourcePath || "file/d/"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {segments.fileId ? `id:${segments.fileId.slice(0, 10)}...` : "id:missing"}
                  </span>
                  {segments.accessParams && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {segments.accessParams}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View-Only Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-subtle-light dark:bg-subtle-dark border border-border-light dark:border-border-dark cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmedViewOnly}
              onChange={(e) => setConfirmedViewOnly(e.target.checked)}
              className="mt-0.5 rounded border-border-light dark:border-border-dark text-brand-trunk focus:ring-brand-trunk"
            />
            <span className="text-[11px] text-gray-700 dark:text-gray-300">
              I certify that this external Google Drive document is configured for public view-only access without edit/macro execution capabilities.
            </span>
          </label>

          {/* PRIOR VERIFICATION OVERRIDE CHECKBOX */}
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                PRIOR VERIFICATION OVERRIDE:
              </span>
              <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded font-bold uppercase">
                Admin Exclusive
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPriorVerified}
                onChange={(e) => setIsPriorVerified(e.target.checked)}
                className="mt-0.5 rounded border-amber-500 text-brand-trunk focus:ring-brand-trunk"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Has this work been verified prior to this contribution?
                </span>
                <span className="text-[11px] text-gray-600 dark:text-gray-400 block mt-0.5">
                  {isPriorVerified ? (
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ✓ Checked: Bypasses the review queue and immediately publishes to Archive as Approved (&ldquo;VERIFIED BY ADMIN&rdquo;).
                    </strong>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      • Default (Unchecked): If you cannot verify this work now, leaving this unchecked routes it into the &ldquo;Under Verification&rdquo; queue so community Verifiers can inspect and verify it themselves.
                    </span>
                  )}
                </span>
              </div>
            </label>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Work Title"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Author Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author / Pen Name"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Fandom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fandom}
                onChange={(e) => setFandom(e.target.value)}
                placeholder="e.g. Genshin Impact, Good Omens"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Relationship / Pairing
              </label>
              <input
                type="text"
                value={pairing}
                onChange={(e) => setPairing(e.target.value)}
                placeholder="e.g. Character A/Character B"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Content Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value as typeof rating)}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              >
                <option value="General Audiences">General Audiences</option>
                <option value="Teen And Up Audiences">Teen And Up Audiences</option>
                <option value="Mature">Mature</option>
                <option value="Explicit">Explicit</option>
                <option value="Not Rated">Not Rated</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Word Count
              </label>
              <input
                type="number"
                min="0"
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="15000"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Summary
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary or description of the work"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Additional Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Fluff, Slow Burn, Alternate Universe"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 rounded-lg hover:bg-subtle-light dark:hover:bg-subtle-dark transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-lg font-bold text-white transition shadow-xs flex items-center gap-2 ${
                isPriorVerified
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-brand-trunk hover:bg-brand-bark"
              }`}
            >
              {loading ? (
                "Submitting..."
              ) : isPriorVerified ? (
                <>
                  <span>✓</span> Direct Publish (Approved)
                </>
              ) : (
                <>
                  <span>+</span> Submit to Verification Queue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
