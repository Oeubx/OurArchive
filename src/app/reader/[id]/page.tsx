"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TakedownModal } from "@/components/takedown/TakedownModal";
import { getLinkById } from "@/lib/linkService";

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
  pdfPreviewUrl?: string;
  contentHtml?: string | null;
  rawDriveUrl?: string;
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

  // Reader customization state
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSizePx, setFontSizePx] = useState<number>(18);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    if (!workId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/reader/${workId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load reader stream.");
        }
        setData(json);
      })
      .catch(() => {
        // Fallback to local verified seed records so works can be read immediately
        const seedLink = getLinkById(workId);
        if (seedLink) {
          setData({
            workId: seedLink.id,
            title: seedLink.title,
            authorName: seedLink.authorName,
            fandom: seedLink.fandom,
            pairing: seedLink.pairing || null,
            rating: seedLink.rating,
            wordCount: seedLink.wordCount,
            summary: seedLink.summary,
            tags: seedLink.tags,
            isPdf: seedLink.mimeType.includes("pdf"),
            pdfPreviewUrl: seedLink.rawDriveUrl,
            rawDriveUrl: seedLink.rawDriveUrl,
            contentHtml: `
              <div class="space-y-4">
                <p><strong>Emergency Read-Only Reader Mode</strong></p>
                <p class="italic text-gray-600 dark:text-gray-400">&ldquo;${seedLink.summary}&rdquo;</p>
                <hr class="my-4 border-gray-300 dark:border-gray-700" />
                <p>This fanwork is mirrored in OurArchive's emergency temporary library for community access while main archive servers undergo maintenance.</p>
                <p>All transformative works remain the 100% intellectual property of <strong>${seedLink.authorName}</strong>. Zero files are stored permanently on OurArchive disks.</p>
                <p>To read the full raw file directly within Google Drive or download a copy for offline access, please use the <em>Open Original Drive Link</em> button located in the toolbar above.</p>
              </div>
            `,
          });
        } else {
          setError("Error connecting to reader stream.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workId]);

  const themeClasses: Record<ThemeMode, { container: string; text: string; header: string; meta: string }> = {
    light: {
      container: "bg-[#f6f6f4]", // Soft warm off-white (not overly stark white)
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
              className="font-semibold text-ao3-red hover:underline flex items-center gap-1"
            >
              <span>&larr;</span> Library Index
            </Link>
            {data && (
              <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium hidden xs:inline">
                {data.title}
              </span>
            )}
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Google Drive Redirection Button */}
            {data?.rawDriveUrl && (
              <a
                href={data.rawDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-ao3-red hover:bg-ao3-darkred text-white text-[11px] font-semibold rounded shadow-xs transition flex items-center gap-1"
                title="Open directly in Google Drive"
              >
                <span>🔗</span> Drive File &rarr;
              </a>
            )}

            {/* Font Family Selector */}
            <div className="flex items-center border border-gray-400/40 rounded overflow-hidden">
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-2 py-1 font-serif text-[11px] ${
                  fontFamily === "serif" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Serif font (Book style)"
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-2 py-1 font-sans text-[11px] border-l border-gray-400/40 ${
                  fontFamily === "sans" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Sans font (Modern)"
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`px-2 py-1 font-mono text-[11px] border-l border-gray-400/40 ${
                  fontFamily === "mono" ? "bg-ao3-red text-white" : "hover:bg-black/10"
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
                  theme === "light" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Warm Parchment mode"
              >
                Warm
              </button>
              <button
                onClick={() => setTheme("sepia")}
                className={`px-2 py-1 text-[11px] border-l border-gray-400/40 ${
                  theme === "sepia" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Sepia mode"
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-2 py-1 text-[11px] border-l border-gray-400/40 ${
                  theme === "dark" ? "bg-ao3-red text-white" : "hover:bg-black/10"
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
                className="px-4 py-2 bg-ao3-red text-white text-xs font-semibold rounded hover:bg-ao3-darkred transition"
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
                {data.rawDriveUrl && (
                  <div>
                    <a
                      href={data.rawDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ao3-red font-medium hover:underline"
                    >
                      Open in Google Drive &rarr;
                    </a>
                  </div>
                )}
              </div>
            </header>

            {/* Document Content Display */}
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

            {/* Reading Complete Footer */}
            <footer className="pt-12 border-t border-black/10 dark:border-white/10 text-center text-xs opacity-75 space-y-3">
              <p>End of fanwork mirror.</p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white font-semibold rounded shadow-xs transition"
                >
                  &larr; Back to Library Search
                </Link>
                {data.rawDriveUrl && (
                  <a
                    href={data.rawDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    View Original Drive Link
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
