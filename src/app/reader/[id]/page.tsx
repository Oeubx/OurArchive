"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TakedownModal } from "@/components/takedown/TakedownModal";

import { getCurrentUserRole } from "@/lib/rbacService";
import {
  getBookmarkForWork,
  saveReadingProgress,
  ReaderBookmark,
} from "@/lib/bookmarkService";
import type { UserRole } from "@/lib/types";

export interface CollectionChildWork {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

interface ReaderData {
  workId: string;
  title: string;
  authorName: string;
  fandom: string;
  pairing: string | null;
  rating: string;
  wordCount: number;
  summary: string | null;
  tags: string[];
  isPdf: boolean;
  isFolder?: boolean;
  collectionWorks?: CollectionChildWork[];
  pdfPreviewUrl?: string;
  contentHtml?: string | null;
  rawDriveUrl?: string;
  uploaderUserId?: string;
}

type FontFamily = "serif" | "sans" | "mono";
type ThemeMode = "light" | "sepia" | "dark";

export default function ReaderPage() {
  const params = useParams();
  const workId = params?.id as string;

  const [data, setData] = useState<ReaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTakedownModal, setShowTakedownModal] = useState(false);

  // User RBAC State
  const [role, setRole] = useState<UserRole | "guest">("guest");

  // Collection State (Solution A: Folder Indexing & Table of Contents)
  const [selectedChildWork, setSelectedChildWork] = useState<CollectionChildWork | null>(null);
  const [collectionFilter, setCollectionFilter] = useState("");
  const [streamingChild, setStreamingChild] = useState(false);

  // Bookmark State
  const [existingBookmark, setExistingBookmark] = useState<ReaderBookmark | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [bookmarkSavedFeedback, setBookmarkSavedFeedback] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reader customization state
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSizePx, setFontSizePx] = useState<number>(18);
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Synchronize document body and root background with reader theme to eliminate margin gutters on wide screens
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyColor = document.body.style.color;
    const prevDocBg = document.documentElement.style.backgroundColor;

    const bgMap: Record<ThemeMode, { bg: string; color: string }> = {
      light: { bg: "#f6f6f4", color: "#1a1a1a" },
      sepia: { bg: "#fbf0d9", color: "#382b1d" },
      dark: { bg: "#121214", color: "#ededed" },
    };

    const target = bgMap[theme];
    document.body.style.backgroundColor = target.bg;
    document.body.style.color = target.color;
    document.documentElement.style.backgroundColor = target.bg;

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.color = prevBodyColor;
      document.documentElement.style.backgroundColor = prevDocBg;
    };
  }, [theme]);

  // Determine user role and load bookmark
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeRole = getCurrentUserRole();
      setRole(activeRole);
    }
  }, []);

  useEffect(() => {
    if (!workId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/reader/${workId}`)
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const rawText = await res.text().catch(() => "");
          console.error("Non-JSON reader response:", res.status, rawText);
          throw new Error(
            res.status === 404
              ? "This fanwork could not be found or has not been verified yet."
              : `Reader service unavailable (Status ${res.status}). Please try again later.`
          );
        }
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load reader stream.");
        }
        setData(json);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Work not found or unavailable in archive.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workId]);

  // Check for saved reading bookmark on load
  useEffect(() => {
    if (!workId || role === "guest") return;
    const b = getBookmarkForWork(workId, undefined, false);
    if (b && b.scrollPercent > 5) {
      setExistingBookmark(b);
      setShowResumeBanner(true);
    }
  }, [workId, role]);

  // Jump to saved position
  const handleResumeReading = useCallback(() => {
    if (!existingBookmark) return;
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = scrollMax * (existingBookmark.scrollPercent / 100);
    window.scrollTo({ top: targetY, behavior: "smooth" });
    setShowResumeBanner(false);
  }, [existingBookmark]);

  // Solution A: Select and stream a specific child work from a collection
  const handleSelectChildWork = useCallback(
    (child: CollectionChildWork) => {
      setSelectedChildWork(child);
      setStreamingChild(true);
      setError(null);

      fetch(
        `/api/reader/${workId}?childId=${encodeURIComponent(child.id)}&childTitle=${encodeURIComponent(
          child.title
        )}&mimeType=${encodeURIComponent(child.mimeType)}`
      )
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("Could not load selected collection fanwork.");
          }
          const json = await res.json();
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  title: child.title,
                  isPdf: json.isPdf,
                  pdfPreviewUrl: json.pdfPreviewUrl,
                  contentHtml: json.contentHtml,
                }
              : json
          );
        })
        .catch((err: unknown) => {
          console.error("Error streaming collection child work:", err);
          setError(err instanceof Error ? err.message : "Failed to stream collection work.");
        })
        .finally(() => {
          setStreamingChild(false);
        });
    },
    [workId]
  );

  // Return to Collection Table of Contents
  const handleBackToCollection = useCallback(() => {
    setSelectedChildWork(null);
    setLoading(true);
    fetch(`/api/reader/${workId}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workId]);

  // Save bookmark calculation helper
  const saveCurrentProgress = useCallback(
    (manual: boolean = false) => {
      if (!data || role === "guest") return;

      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent =
        scrollMax > 0
          ? Math.min(100, Math.max(0, Math.round((window.scrollY / scrollMax) * 100)))
          : 0;

      // Estimate total pages by standard 350 words per page
      const totalPages = Math.max(1, Math.ceil((data.wordCount || 2500) / 350));
      const lastPage = Math.max(1, Math.ceil((scrollPercent / 100) * totalPages));

      const bookmark: ReaderBookmark = {
        workId: data.workId,
        workTitle: data.title,
        authorName: data.authorName,
        fandom: data.fandom,
        rating: data.rating,
        lastPage,
        totalPages,
        scrollPercent,
        lastReadAt: new Date().toISOString(),
      };

      saveReadingProgress(bookmark, undefined, false);

      if (manual) {
        setBookmarkSavedFeedback(true);
        setTimeout(() => setBookmarkSavedFeedback(false), 2000);
      }
    },
    [data, role]
  );

  // Debounced auto-save on scroll for logged-in users
  useEffect(() => {
    if (role === "guest" || !data) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        saveCurrentProgress(false);
      }, 750);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [role, data, saveCurrentProgress]);

  // URL Privacy check: Only Admin or Verifier can see raw external drive links
  const canRevealDrive = role === "admin" || role === "verifier";

  const themeClasses: Record<ThemeMode, { container: string; text: string; header: string; meta: string }> = {
    light: {
      container: "bg-[#f6f6f4]", // Soft warm off-white
      text: "text-[#1a1a1a]",
      header: "bg-[#ededeb] border-[#e5e5e0] text-[#1a1a1a]",
      meta: "bg-white border-[#e5e5e0] text-[#444440]",
    },
    sepia: {
      container: "bg-[#fbf0d9]",
      text: "text-[#382b1d]",
      header: "bg-[#f0e2c2] border-[#decba5] text-[#382b1d]",
      meta: "bg-[#f5e9ce] border-[#decba5] text-[#54412c]",
    },
    dark: {
      container: "bg-[#121214]", // Obsidian graphite
      text: "text-[#ededed]",
      header: "bg-[#1a1a1e] border-[#2a2a30] text-[#ededed]",
      meta: "bg-[#18181c] border-[#2a2a30] text-[#9ca3af]",
    },
  };

  const fontClasses: Record<FontFamily, string> = {
    serif: "font-serif leading-relaxed",
    sans: "font-sans leading-relaxed",
    mono: "font-mono leading-normal",
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`min-h-screen transition-colors duration-200 -mx-4 -my-4 p-4 ${currentTheme.container}`}>
      {/* Sticky Reader Toolbar */}
      <header className={`sticky top-0 z-40 border-b py-2.5 px-4 backdrop-blur-md shadow-xs ${currentTheme.header}`}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-semibold text-brand-trunk hover:underline flex items-center gap-1"
            >
              <span>&larr;</span> Library Index
            </Link>
            {data && (
              <span className="truncate max-w-[180px] sm:max-w-[260px] font-medium hidden xs:inline">
                {data.title}
              </span>
            )}
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOOKMARK BUTTON (Authenticated users only) */}
            {role !== "guest" ? (
              <button
                type="button"
                onClick={() => saveCurrentProgress(true)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition flex items-center gap-1 shadow-2xs ${
                  bookmarkSavedFeedback
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-gray-700 dark:text-gray-200"
                }`}
                title="Save current reading page to your bookmarks"
              >
                <span>🔖</span>
                <span>{bookmarkSavedFeedback ? "Saved!" : "Bookmark"}</span>
              </button>
            ) : (
              <span
                className="text-[10px] text-gray-500 italic hidden sm:inline"
                title="Sign in as a contributor to automatically save reading bookmarks"
              >
                💡 Sign in to bookmark
              </span>
            )}

            {/* Direct Google Drive Redirection Button (Admin & Verifier ONLY - Anti-Scraping Protection) */}
            {canRevealDrive && data?.rawDriveUrl && (
              <a
                href={data.rawDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-brand-trunk hover:bg-brand-bark text-white text-[11px] font-semibold rounded shadow-xs transition flex items-center gap-1"
                title="Admin/Verifier view: Open directly in Google Drive"
              >
                <span>🔗</span> Drive File &rarr;
              </a>
            )}

            {/* Font Family Selector */}
            <div className="flex items-center border border-gray-400/40 rounded overflow-hidden">
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-2 py-1 font-serif text-[11px] ${
                  fontFamily === "serif" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Serif font (Book style)"
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-2 py-1 font-sans text-[11px] border-l border-gray-400/40 ${
                  fontFamily === "sans" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Sans font (Modern)"
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`px-2 py-1 font-mono text-[11px] border-l border-gray-400/40 ${
                  fontFamily === "mono" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Mono font (Code/Draft)"
              >
                Mono
              </button>
            </div>

            {/* Font Size Adjusters */}
            <div className="flex items-center border border-gray-400/40 rounded overflow-hidden">
              <button
                onClick={() => setFontSizePx((prev) => Math.max(14, prev - 2))}
                className="px-2.5 py-1 hover:bg-black/10 text-xs font-bold"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="px-1.5 text-[10px] opacity-75 font-mono">{fontSizePx}px</span>
              <button
                onClick={() => setFontSizePx((prev) => Math.min(28, prev + 2))}
                className="px-2.5 py-1 hover:bg-black/10 text-xs font-bold border-l border-gray-400/40"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center border border-gray-400/40 rounded overflow-hidden">
              <button
                onClick={() => setTheme("light")}
                className={`px-2 py-1 text-[11px] ${
                  theme === "light" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Warm Parchment mode"
              >
                Warm
              </button>
              <button
                onClick={() => setTheme("sepia")}
                className={`px-2 py-1 text-[11px] border-l border-gray-400/40 ${
                  theme === "sepia" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Sepia mode"
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-2 py-1 text-[11px] border-l border-gray-400/40 ${
                  theme === "dark" ? "bg-brand-trunk text-white" : "hover:bg-black/10"
                }`}
                title="Obsidian Dark mode"
              >
                Dark
              </button>
            </div>

            {/* Report Takedown Button */}
            <button
              onClick={() => setShowTakedownModal(true)}
              className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded text-xs transition"
              title="Report copyright concern or author takedown"
            >
              Takedown
            </button>
          </div>
        </div>
      </header>

      {/* RESUME READING FLOATING BANNER */}
      {showResumeBanner && existingBookmark && (
        <aside
          aria-label="Resume reading notification"
          className="max-w-2xl mx-auto my-3 p-3 bg-brand-trunk/10 dark:bg-brand-trunk/20 border border-brand-trunk/30 rounded-lg flex items-center justify-between gap-3 text-xs shadow-xs animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🔖</span>
            <span>
              Welcome back! You were reading <strong>Page {existingBookmark.lastPage}</strong> ({existingBookmark.scrollPercent}% completed).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumeReading}
              className="px-3 py-1 bg-brand-trunk hover:bg-brand-bark text-white font-semibold rounded text-xs transition shadow-2xs"
            >
              Resume &rarr;
            </button>
            <button
              type="button"
              onClick={() => setShowResumeBanner(false)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Main Reader View Container */}
      <main className="max-w-3xl mx-auto py-8 px-4">
        {loading && (
          <div className="space-y-4 animate-pulse py-12">
            <div className="h-6 bg-black/10 rounded w-1/3" />
            <div className="h-4 bg-black/10 rounded w-1/4" />
            <div className="h-32 bg-black/10 rounded" />
            <div className="h-64 bg-black/10 rounded" />
          </div>
        )}

        {error && !data && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg text-center space-y-3">
            <h2 className="text-base font-bold">Failed to Stream Work</h2>
            <p className="text-xs">{error}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-4 py-2 bg-brand-trunk text-white text-xs font-semibold rounded hover:bg-brand-bark transition"
              >
                Return to Library Search
              </Link>
            </div>
          </div>
        )}

        {data && (
          <article className="space-y-6">
            {/* Work Metadata Header */}
            <header className={`p-6 rounded-lg border space-y-3 ${currentTheme.meta}`}>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {data.title}
                </h1>
                <p className="text-sm">
                  by <strong className="font-semibold underline">{data.authorName}</strong>
                </p>
              </div>

              <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5 opacity-90 pt-1">
                <span>
                  <strong>Fandom:</strong> {data.fandom}
                </span>
                {data.pairing && (
                  <span>
                    <strong>Pairing:</strong> {data.pairing}
                  </span>
                )}
                <span>
                  <strong>Rating:</strong> {data.rating}
                </span>
                <span>
                  <strong>Words:</strong> {data.wordCount.toLocaleString()}
                </span>
              </div>

              {data.summary && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10 text-xs italic leading-relaxed opacity-90">
                  &ldquo;{data.summary}&rdquo;
                </div>
              )}

              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {data.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] opacity-80 gap-2 border-t border-black/10 dark:border-white/10">
                <div>
                  🔒 <em>Ephemeral Read-Only Stream: No files are persisted on server disks.</em>
                </div>
                {/* Gated Drive URL for Admins/Verifiers Only */}
                {canRevealDrive && data.rawDriveUrl && (
                  <div>
                    <a
                      href={data.rawDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-trunk font-medium hover:underline"
                    >
                      Open in Google Drive (Admin) &rarr;
                    </a>
                  </div>
                )}
              </div>
            </header>

            {/* Document Content or Collection Table of Contents */}
            {data.isFolder && !selectedChildWork ? (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>📁</span> Collection Table of Contents
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {data.collectionWorks && data.collectionWorks.length > 0
                        ? `Contains ${data.collectionWorks.length} fanworks in this archive. Select any work to stream.`
                        : "No readable fanwork documents discovered in this shared folder."}
                    </p>
                  </div>
                  {data.collectionWorks && data.collectionWorks.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter collection works..."
                      value={collectionFilter}
                      onChange={(e) => setCollectionFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-brand-bark"
                    />
                  )}
                </div>

                {data.collectionWorks && data.collectionWorks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {data.collectionWorks
                      .filter((w) => {
                        if (!collectionFilter.trim()) return true;
                        const q = collectionFilter.toLowerCase();
                        return w.title.toLowerCase().includes(q) || w.fileName.toLowerCase().includes(q);
                      })
                      .map((work, idx) => (
                        <div
                          key={work.id || idx}
                          onClick={() => handleSelectChildWork(work)}
                          className="group flex items-center justify-between p-3.5 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 hover:bg-brand-parchment dark:hover:bg-brand-bark/20 hover:border-brand-bark/30 transition cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                work.mimeType.includes("pdf")
                                  ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900"
                                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              }`}
                            >
                              {work.mimeType.includes("pdf") ? "PDF" : "DOC"}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-trunk transition truncate">
                                {work.title}
                              </h3>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {work.fileName} {work.sizeBytes > 0 && `• ${(work.sizeBytes / 1024).toFixed(0)} KB`}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-trunk group-hover:translate-x-0.5 transition-transform">
                            <span>Read</span>
                            <span>&rarr;</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This folder either contains sub-folders, unsupported file formats, or is private.
                    </p>
                    <p className="text-xs text-gray-400">
                      Ensure the Google Drive permissions are set to &quot;Anyone with the link can view&quot;.
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Active Child Work Banner (when reading inside a collection) */}
                {selectedChildWork && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-trunk/10 border border-brand-trunk/20 text-xs">
                    <div className="flex items-center gap-2 text-brand-bark dark:text-brand-light truncate">
                      <span>📁</span>
                      <span>
                        Part of collection: <strong className="font-semibold underline">{data.title}</strong>
                      </span>
                    </div>
                    <button
                      onClick={handleBackToCollection}
                      className="shrink-0 font-semibold text-brand-trunk hover:underline ml-2"
                    >
                      &larr; Table of Contents
                    </button>
                  </div>
                )}

                {/* Loading state while switching child work */}
                {streamingChild ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="inline-block w-6 h-6 border-2 border-brand-trunk border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Loading fanwork stream...</p>
                  </div>
                ) : (
                  <section
                    style={{ fontSize: `${fontSizePx}px` }}
                    className={`pt-4 ${fontClasses[fontFamily]} ${currentTheme.text}`}
                  >
                    {data.isPdf && data.pdfPreviewUrl ? (
                      <div className="w-full h-[80vh] border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                        <iframe
                          src={data.pdfPreviewUrl}
                          title={data.title}
                          className="w-full h-full"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    ) : data.contentHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: data.contentHtml }}
                        className="prose prose-neutral dark:prose-invert max-w-none space-y-4 reader-content"
                      />
                    ) : (
                      <div className="text-center py-12 opacity-60 text-sm">
                        No text content available in stream.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* Reading Complete Footer */}
            <footer className="pt-12 border-t border-black/10 dark:border-white/10 text-center text-xs opacity-75 space-y-3">
              <p>End of fanwork mirror.</p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white font-semibold rounded shadow-xs transition"
                >
                  &larr; Back to Library Search
                </Link>
                {/* Gated Drive URL for Admins/Verifiers Only */}
                {canRevealDrive && data.rawDriveUrl && (
                  <a
                    href={data.rawDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    View Original Drive Link (Admin)
                  </a>
                )}
              </div>
            </footer>
          </article>
        )}
      </main>

      {/* Takedown Modal in Reader */}
      <TakedownModal
        isOpen={showTakedownModal}
        workId={workId}
        workTitle={data?.title}
        onClose={() => setShowTakedownModal(false)}
      />
    </div>
  );
}
