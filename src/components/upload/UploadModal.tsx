"use client";

import React, { useState } from "react";
import { addMyContribution } from "@/lib/contributorService";
import { segmentDriveUrl } from "@/lib/urlSegmenter";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [confirmedViewOnly, setConfirmedViewOnly] = useState(false);

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
  const [canonicalSourceUrl, setCanonicalSourceUrl] = useState("");
  const [isOwnerMasked, setIsOwnerMasked] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const segments = segmentDriveUrl(driveUrl);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Enforce link segmentation and view-only safety check
    if (!segments.isValid) {
      setError(segments.errorMessage || "Please enter a valid Google Drive or Docs link.");
      return;
    }

    if (!confirmedViewOnly) {
      setError("Please confirm that the link is view-only and has edit permissions disabled.");
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

      // Add to local contributor store so it appears immediately on user's dashboard
      addMyContribution({
        title: title.trim() || "Untitled Fanwork",
        authorName: authorName.trim(),
        fandom: fandom.trim(),
        pairing: pairing.trim() || undefined,
        rating,
        wordCount: parsedWordCount,
        summary: summary.trim(),
        tags,
        rawDriveUrl: canonicalUrl,
        mimeType: "application/pdf",
        isOwnerMasked,
        uploadedBy: "current_contributor",
        uploadedByRole: "contributor",
      });

      // Also dispatch to API endpoint if available
      try {
        await fetch("/api/links/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driveUrl: canonicalUrl,
            title: title.trim() || undefined,
            authorName: authorName.trim(),
            fandom: fandom.trim(),
            pairing: pairing.trim() || undefined,
            rating,
            wordCount: parsedWordCount,
            summary: summary.trim() || undefined,
            tags,
            canonicalAo3Url: canonicalSourceUrl.trim() || undefined,
            isOwnerMasked,
          }),
        });
      } catch {
        // API offline fallback handled gracefully
      }

      setSuccessMessage("Work submitted successfully! The segmented link is now pending automated verification.");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-xl w-full border border-border-light dark:border-border-dark overflow-hidden my-8 text-gray-900 dark:text-gray-100">
        <div className="bg-brand-trunk text-white px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide">Submit View-Only Fanwork (Contributor)</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-xs leading-relaxed">
              <strong>Error:</strong> {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded text-xs leading-relaxed">
              {successMessage}
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded text-[11px] text-amber-900 dark:text-amber-300 leading-normal">
            <strong>Zero-Download & Safety Rule:</strong> Only Google Drive/Docs links set to <em>&quot;Anyone with the link can view&quot;</em> are accepted. Editable links will be rejected to protect the author&apos;s content from vandalism.
          </div>

          {/* SEGMENTED LINK INPUT BOX (Prevents Abrupt Executions) */}
          <div className="bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-gray-800 dark:text-gray-200 text-xs">
                Google Drive View-Only Link (Segmented Safety Input) <span className="text-red-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-gray-500">Defanged Preview</span>
            </div>

            <input
              type="text"
              required
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="Paste raw link: e.g. https://drive.google.com/file/d/1BxyZ9qK8.../view?usp=sharing"
              className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs font-mono"
            />

            {/* Sliced Segments Display */}
            {driveUrl && (
              <div className="space-y-2 pt-1 border-t border-border-light dark:border-border-dark">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Deconstructed Non-Executable Slices:
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Slice 1: Domain */}
                  <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-gray-400 block text-[9px] uppercase font-mono">1. Domain Prefix</span>
                    <span className="font-mono font-semibold text-green-700 dark:text-green-400 select-all">
                      {segments.protocolDomain}
                    </span>
                  </div>

                  {/* Slice 2: Resource Path */}
                  <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-gray-400 block text-[9px] uppercase font-mono">2. Resource Path</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 select-all">
                      {segments.resourcePath || "(none)"}
                    </span>
                  </div>

                  {/* Slice 3: File ID */}
                  <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-gray-400 block text-[9px] uppercase font-mono">
                      3. Resource File ID ({segments.fileId.length} chars)
                    </span>
                    <span className="font-mono text-brand-trunk dark:text-brand-light font-bold select-all break-all">
                      {segments.fileId || "(missing ID)"}
                    </span>
                  </div>

                  {/* Slice 4: Access Mode */}
                  <div className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-gray-400 block text-[9px] uppercase font-mono">4. Mode Parameters</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400 select-all">
                      {segments.accessParams || "view?usp=sharing"}
                    </span>
                  </div>
                </div>

                {/* Validation verdict */}
                <div className="text-[11px] pt-1">
                  {segments.isValid ? (
                    <div className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-1">
                      <span>✅</span>
                      <span>Link successfully sliced into 4 safe, verified segments.</span>
                    </div>
                  ) : (
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      ⚠️ {segments.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-2 pt-1 border-t border-border-light dark:border-border-dark">
              <input
                type="checkbox"
                id="confirmViewOnly"
                checked={confirmedViewOnly}
                onChange={(e) => setConfirmedViewOnly(e.target.checked)}
                className="mt-0.5 rounded text-brand-trunk focus:ring-brand-trunk"
              />
              <label htmlFor="confirmViewOnly" className="text-gray-700 dark:text-gray-300 text-[11px] leading-tight cursor-pointer">
                I have inspected the segmented pieces and confirm this link is set to <strong>view-only</strong> with edit permissions disabled.
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Work Title <span className="text-gray-400 font-normal">(Optional, uses file name if blank)</span>
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
                Original Author <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
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
                Fandom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fandom}
                onChange={(e) => setFandom(e.target.value)}
                placeholder="e.g. Heartstopper, Arcane"
                className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Pairing / Relationship</label>
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
                    e.target.value as "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit" | "Not Rated"
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
              placeholder="Short description of the work..."
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

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="maskOwner"
              checked={isOwnerMasked}
              onChange={(e) => setIsOwnerMasked(e.target.checked)}
              className="rounded text-brand-trunk focus:ring-brand-trunk"
            />
            <label htmlFor="maskOwner" className="text-gray-700 dark:text-gray-300 text-xs cursor-pointer">
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
              disabled={loading || !segments.isValid || !confirmedViewOnly}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-trunk hover:bg-brand-bark rounded transition disabled:opacity-40"
            >
              {loading ? "Verifying & Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
