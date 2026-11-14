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

  // Granular fanwork categorization state
  const [categories, setCategories] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [characters, setCharacters] = useState("");
  const [chapters, setChapters] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  async function handleScanMetadata() {
    if (!driveUrl.trim()) {
      setError("Please enter a Google Drive link first before scanning.");
      return;
    }

    setScanning(true);
    setError(null);
    setScanNotice(null);

    try {
      const res = await fetch("/api/links/scan-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveUrl: driveUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to scan metadata from link.");
      }

      if (data.metadata) {
        const meta = data.metadata;
        if (meta.title) setTitle(meta.title);
        if (meta.fandom) setFandom(meta.fandom);
        if (meta.pairing) setPairing(meta.pairing);
        if (meta.rating) {
          const validRatings = [
            "General Audiences",
            "Teen And Up Audiences",
            "Mature",
            "Explicit",
            "Not Rated",
          ];
          if (validRatings.includes(meta.rating)) {
            setRating(meta.rating as typeof rating);
          }
        }
        if (meta.wordCount) setWordCount(meta.wordCount);
        if (meta.canonicalSourceUrl) setCanonicalSourceUrl(meta.canonicalSourceUrl);
        if (meta.summary) setSummary(meta.summary);
        if (meta.additionalTags?.length) setTagsInput(meta.additionalTags.join(", "));
        if (meta.categories?.length) setCategories(meta.categories);
        if (meta.warnings?.length) setWarnings(meta.warnings);
        if (meta.characters?.length) setCharacters(meta.characters.join(", "));
        if (meta.chapters) setChapters(meta.chapters);
        if (typeof meta.isComplete === "boolean") setIsComplete(meta.isComplete);

        setDetailsExpanded(true);
        setScanNotice(
          data.isStandardCoverFormatted
            ? "✨ Metadata scanned and fields auto-filled from cover page!"
            : "ℹ️ Plain document detected. Enter details manually if desired."
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error scanning metadata.");
    } finally {
      setScanning(false);
    }
  }

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
          categories,
          warnings,
          characters: characters ? characters.split(",").map((c) => c.trim()).filter(Boolean) : [],
          relationships: pairing ? [pairing.trim()] : [],
          isComplete,
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
                {/* Auto-Scan Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-brand-trunk/5 dark:bg-brand-trunk/15 border border-brand-trunk/20">
                  <div className="text-xs">
                    <span className="font-bold text-brand-trunk dark:text-brand-light flex items-center gap-1.5">
                      <span>🪄</span>
                      <span>Fanwork First-Page Scanner</span>
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Extract title, rating, categories, warnings, characters, and word count directly from the cover.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleScanMetadata}
                    disabled={scanning || !driveUrl.trim()}
                    className="px-3.5 py-1.5 bg-brand-trunk hover:bg-brand-bark disabled:opacity-50 text-white rounded text-xs font-semibold shrink-0 transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {scanning ? (
                      <>
                        <span className="animate-spin text-xs">⏳</span>
                        <span>Scanning Cover...</span>
                      </>
                    ) : (
                      <>
                        <span>🪄</span>
                        <span>Scan Metadata</span>
                      </>
                    )}
                  </button>
                </div>

                {scanNotice && (
                  <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs">
                    {scanNotice}
                  </div>
                )}

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

                {/* Categories */}
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Category <span className="text-gray-400 font-normal">(Select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["F/F", "M/M", "F/M", "Gen", "Multi", "Other"].map((cat) => {
                      const selected = categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setCategories(categories.filter((c) => c !== cat));
                            } else {
                              setCategories([...categories, cat]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                            selected
                              ? "bg-brand-trunk text-white border-brand-trunk"
                              : "bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Archive Warnings */}
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Archive Warnings
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "No Archive Warnings Apply",
                      "Creator Chose Not To Use Archive Warnings",
                      "Graphic Depictions Of Violence",
                      "Major Character Death",
                      "Rape/Non-Con",
                      "Underage",
                    ].map((warn) => {
                      const selected = warnings.includes(warn);
                      return (
                        <button
                          key={warn}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setWarnings(warnings.filter((w) => w !== warn));
                            } else {
                              setWarnings([...warnings, warn]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                            selected
                              ? "bg-amber-700 text-white border-amber-700"
                              : "bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                          }`}
                        >
                          {warn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Characters & Chapters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Characters <span className="text-gray-400 font-normal">(Comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={characters}
                      onChange={(e) => setCharacters(e.target.value)}
                      placeholder="e.g. Bae Jinsol, Seol Yoona"
                      className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Chapters &amp; Completion Status
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chapters}
                        onChange={(e) => setChapters(e.target.value)}
                        placeholder="e.g. 3/3"
                        className="w-24 px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk outline-hidden text-xs font-mono"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isComplete}
                          onChange={(e) => setIsComplete(e.target.checked)}
                          className="rounded text-brand-trunk focus:ring-brand-trunk cursor-pointer"
                        />
                        <span>Complete Work</span>
                      </label>
                    </div>
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
              disabled={loading || scanning}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-trunk hover:bg-brand-bark rounded shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {(loading || scanning) && (
                <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 inline text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              )}
              {scanning ? "Scanning Metadata..." : loading ? "Submitting to Queue..." : "Send to Review Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
