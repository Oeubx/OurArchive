"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [isFolder, setIsFolder] = useState(true); // Default to folder grouping
  const [confirmedViewOnly, setConfirmedViewOnly] = useState(false);
  const [isPriorVerified, setIsPriorVerified] = useState(false); // Default: Unchecked
  const [detailsExpanded, setDetailsExpanded] = useState(false); // Default: closed

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

  // Granular fanwork categorization state
  const [categories, setCategories] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [characters, setCharacters] = useState("");
  const [chapters, setChapters] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const segments = segmentDriveUrl(driveUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  async function handleScanMetadata() {
    if (!segments.isValid) {
      setError("Please paste a valid Google Drive link first before scanning.");
      return;
    }

    setScanning(true);
    setError(null);
    setScanNotice(null);

    try {
      const res = await fetch("/api/links/scan-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveUrl: segments.canonicalUrl }),
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
        if (meta.summary) setSummary(meta.summary);
        if (meta.additionalTags?.length) setTagsInput(meta.additionalTags.join(", "));
        if (meta.categories?.length) setCategories(meta.categories);
        if (meta.warnings?.length) setWarnings(meta.warnings);
        if (meta.characters?.length) setCharacters(meta.characters.join(", "));
        if (meta.chapters) setChapters(meta.chapters);
        if (typeof meta.isComplete === "boolean") setIsComplete(meta.isComplete);
        if (typeof meta.isNsfw === "boolean") setIsNsfw(meta.isNsfw);

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

    if (!segments.isValid) {
      setError(segments.errorMessage || "Please enter a valid Google Drive or Docs link.");
      return;
    }

    if (!confirmedViewOnly) {
      setError("Please confirm that the link is view-only and safe.");
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

      const resolvedTitle = title.trim() || (isFolder ? "Curated Fanwork Folder" : "Untitled Fanwork");
      const resolvedAuthor = authorName.trim() || "Anonymous Contributor";
      const resolvedFandom = fandom.trim() || "General / Multi-Fandom";

      // Submit directly to Supabase via authenticated API endpoint
      const res = await fetch("/api/links/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: canonicalUrl,
          title: resolvedTitle,
          authorName: resolvedAuthor,
          fandom: resolvedFandom,
          pairing: pairing.trim() || undefined,
          rating,
          wordCount: parsedWordCount,
          summary: summary.trim(),
          tags,
          categories,
          warnings,
          characters: characters ? characters.split(",").map((c) => c.trim()).filter(Boolean) : [],
          relationships: pairing ? [pairing.trim()] : [],
          isComplete,
          isNsfw,
          driveOwnerEmail: driveOwnerEmail.trim() || undefined,
          isPriorVerified,
          uploadMode: "assisted_admin",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload fanwork as admin.");
      }

      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to upload fanwork as admin.");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
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
            {/* Folder Grouping Checkbox (Defaults to Folder) */}
            <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="adminFolderGroupingCheckbox"
                  checked={isFolder}
                  onChange={(e) => setIsFolder(e.target.checked)}
                  className="mt-0.5 rounded text-brand-trunk focus:ring-brand-trunk cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                    This link is a Folder grouping (e.g. series, multi-chapter work, or collection)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                    Recommended: Enables indexing multiple related fanwork files, chapter collections, or entire series under a single view-only link. Uncheck only if uploading an isolated individual file.
                  </p>
                </div>
              </label>
            </div>
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
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPriorVerified(checked);
                  if (checked && segments.isValid) {
                    handleScanMetadata();
                  }
                }}
                className="mt-0.5 rounded border-amber-500 text-brand-trunk focus:ring-brand-trunk"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Has this work been verified prior to this contribution?
                </span>
                <span className="text-[11px] text-gray-600 dark:text-gray-400 block mt-0.5">
                  {isPriorVerified ? (
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ✓ Checked: Bypasses the review queue and immediately publishes to Archive as Approved (&ldquo;VERIFIED BY ADMIN&rdquo;). Triggers first-page metadata scan.
                    </strong>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      • Default (Unchecked): If you cannot verify this work now, leaving this unchecked routes it into the &ldquo;Under Verification&rdquo; queue so community Verifiers can inspect and verify it themselves.
                    </span>
                  )}
                </span>
                {scanning && (
                  <div className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 animate-pulse">
                    <span>⏳</span>
                    <span>Scanning first-page cover metadata... Submit button is locked until finished.</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Expandable Sub-Details Section (Default Closed) */}
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
                    disabled={scanning || !segments.isValid}
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
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Work Title <span className="text-gray-400 font-normal">(Optional, uses folder/file name if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. To Build a Home"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Author Name <span className="text-gray-400 font-normal">(Optional, defaults to Anonymous)</span>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Anonymous Contributor"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Fandom <span className="text-gray-400 font-normal">(Optional, defaults to General)</span>
                    </label>
                    <input
                      type="text"
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
                    Summary / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief summary or description of the work"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
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
                  <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
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
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Characters <span className="text-gray-400 font-normal">(Comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={characters}
                      onChange={(e) => setCharacters(e.target.value)}
                      placeholder="e.g. Bae Jinsol, Seol Yoona"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Chapters &amp; Completion Status
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chapters}
                        onChange={(e) => setChapters(e.target.value)}
                        placeholder="e.g. 3/3"
                        className="w-24 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 text-xs font-mono"
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
              </div>
            )}
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
              disabled={loading || scanning}
              className={`px-5 py-2 rounded-lg font-bold text-white transition shadow-xs flex items-center gap-2 ${
                isPriorVerified
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-brand-trunk hover:bg-brand-bark"
              } disabled:opacity-40`}
            >
              {(loading || scanning) && (
                <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 inline text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              )}
              {scanning ? (
                "Scanning Metadata (Locked)..."
              ) : loading ? (
                "Cataloging Fanwork..."
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
    </div>,
    document.body
  );
}
