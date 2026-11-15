"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [isFolder, setIsFolder] = useState(true); // Default to folder grouping
  const [isNsfw, setIsNsfw] = useState(false); // SFW by default
  const [showInfoView, setShowInfoView] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false); // Collapsed by default

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

  // Granular fanwork categorization state
  const [categories, setCategories] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [characters, setCharacters] = useState("");
  const [chapters, setChapters] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        if (meta.canonicalSourceUrl) setCanonicalSourceUrl(meta.canonicalSourceUrl);
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
    setSuccessMessage(null);

    // Enforce link segmentation and view-only safety check
    if (!segments.isValid) {
      setError(segments.errorMessage || "Please enter a valid Google Drive or OneDrive link.");
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
      const resolvedTitle = title.trim() || (isFolder ? "Curated Fanwork Folder" : "Untitled Fanwork");
      const resolvedAuthor = authorName.trim() || "Anonymous Contributor";
      const resolvedFandom = fandom.trim() || "General / Multi-Fandom";

      // Dispatch to API endpoint with response validation
      const res = await fetch("/api/links/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: canonicalUrl,
          isFolder,
          isNsfw,
          title: title.trim() || undefined,
          authorName: resolvedAuthor,
          fandom: resolvedFandom,
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
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.error || "Submission failed. Please check permissions or try again.");
      }

      // Add to local contributor store so it appears immediately on user's dashboard
      addMyContribution({
        title: resolvedTitle,
        authorName: resolvedAuthor,
        fandom: resolvedFandom,
        pairing: pairing.trim() || undefined,
        rating,
        wordCount: parsedWordCount,
        summary: summary.trim(),
        tags,
        rawDriveUrl: canonicalUrl,
        mimeType: isFolder ? "application/vnd.google-apps.folder" : "application/pdf",
        isOwnerMasked,
        uploadedBy: "current_contributor",
        uploadedByRole: "contributor",
      });

      const successMsg =
        resData.unpackedCount && resData.unpackedCount > 0
          ? `Collection unpacked! Successfully indexed ${resData.unpackedCount} individual fanworks into library search.`
          : "Work submitted successfully! The link is now live and recorded in the library.";

      setSuccessMessage(successMsg);
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-xl w-full border border-border-light dark:border-border-dark overflow-hidden my-8 text-gray-900 dark:text-gray-100">
        <div className="bg-brand-trunk text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold tracking-wide">
              {showInfoView ? "Folder Limits & Structure Guide" : "Submit View-Only Fanwork (Contributor)"}
            </h2>
            <button
              type="button"
              onClick={() => setShowInfoView(!showInfoView)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                showInfoView
                  ? "bg-white text-brand-trunk hover:bg-white/90 shadow-2xs"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title="View folder ingestion limits and sample pathing"
            >
              <span>ℹ️</span>
              <span>{showInfoView ? "Back to Form" : "Folder Limits & Guide"}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {showInfoView ? (
          <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Google Drive Folder Ingestion Architecture
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  How OurArchive recursively crawls, indexes, and unpacks collection folders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoView(false)}
                className="px-3 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white rounded font-semibold text-xs transition"
              >
                &larr; Back to Form
              </button>
            </div>

            {/* Visual Hierarchy */}
            <div className="space-y-2">
              <span className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[11px]">
                Visual Folder Pathing Example
              </span>
              <pre className="bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg p-3 text-[11px] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto leading-relaxed">
{`// Contributed Root Link (e.g. "My Fanwork Archive")   --> [Depth 0: Main Folder Link]
.// Folder 1 (e.g. "Series A")                          --> [Depth 1: Subfolder]
..// Folder inside Folder 1 (e.g. "Season 1")           --> [Depth 2: Subfolder]
...// Folder inside Season 1 (e.g. "Act I")             --> [Depth 3: Subfolder]
....// Deepest Folder (e.g. "Bonus Chapters")           --> [Depth 4: MAX NESTING LIMIT]
.....// Anything deeper than 4 folders                  --> [SKIPPED - Exceeds depth limit]`}
              </pre>
            </div>

            {/* Ingestion Limits Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg space-y-1">
                <span className="font-bold text-brand-trunk dark:text-brand-light block">Max Nesting Depth</span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Up to <strong>4 levels deep</strong> from the main contributed link. Folders nested deeper are skipped.
                </p>
              </div>

              <div className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg space-y-1">
                <span className="font-bold text-brand-trunk dark:text-brand-light block">Max Subfolders Traversed</span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  At most <strong>30 total subfolders</strong> are visited per collection submission to prevent rate limits.
                </p>
              </div>

              <div className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg space-y-1">
                <span className="font-bold text-brand-trunk dark:text-brand-light block">Max Files Unpacked</span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Up to <strong>100 individual files</strong> per contribution. Each file is cataloged as a searchable work.
                </p>
              </div>

              <div className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg space-y-1">
                <span className="font-bold text-brand-trunk dark:text-brand-light block">Supported File Formats</span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  <code className="text-emerald-700 dark:text-emerald-400 font-mono">.pdf, .docx, .doc, .txt, .epub, .html</code>. Executables and <code className="font-mono">.zip</code> are ignored.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded text-xs text-amber-900 dark:text-amber-300">
              <strong>View-Only Rule Reminder:</strong> Ensure your Google Drive folder and its files are set to <em>&quot;Anyone with the link can view&quot;</em>. Public edit permissions will cause the link to be rejected.
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowInfoView(false)}
                className="w-full sm:w-auto px-5 py-2 bg-brand-trunk hover:bg-brand-bark text-white font-semibold rounded-lg transition"
              >
                &larr; Return to Submission Form
              </button>
            </div>
          </div>
        ) : (
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

          {/* SFW / NSFW CLASSIFICATION SELECTOR */}
          <div className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark space-y-1.5">
            <span className="block font-bold text-gray-800 dark:text-gray-200 text-xs">
              Content Classification <span className="text-red-600">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="content_classification"
                  checked={!isNsfw}
                  onChange={() => {
                    setIsNsfw(false);
                    setRating("General Audiences");
                  }}
                  className="text-brand-trunk focus:ring-brand-trunk"
                />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  🟢 SFW (Safe for Work / General Audiences)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="content_classification"
                  checked={isNsfw}
                  onChange={() => {
                    setIsNsfw(true);
                    setRating("Mature");
                  }}
                  className="text-red-600 focus:ring-red-600"
                />
                <span className="font-semibold text-red-600 dark:text-red-400">
                  🔴 NSFW (18+ / Mature / Explicit)
                </span>
              </label>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Helps readers filter works safely in search. You can also specify an exact rating in the optional details below.
            </p>
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

            {/* Folder Grouping Checkbox (Defaults to Folder) */}
            <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="folderGroupingCheckbox"
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

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-2 pt-1 border-t border-border-light dark:border-border-dark">
              <input
                type="checkbox"
                id="confirmViewOnly"
                checked={confirmedViewOnly}
                onChange={(e) => setConfirmedViewOnly(e.target.checked)}
                className="mt-0.5 rounded text-brand-trunk focus:ring-brand-trunk cursor-pointer"
              />
              <label htmlFor="confirmViewOnly" className="text-gray-700 dark:text-gray-300 text-[11px] leading-tight cursor-pointer">
                I have inspected the segmented pieces and confirm this link is set to <strong>view-only</strong> with edit permissions disabled.
              </label>
            </div>
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
              disabled={loading || scanning || !segments.isValid || !confirmedViewOnly}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-trunk hover:bg-brand-bark rounded transition disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              {(loading || scanning) && (
                <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 inline text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              )}
              {scanning ? "Scanning Metadata..." : loading ? "Verifying & Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
}
