"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TakedownModal } from "@/components/takedown/TakedownModal";

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
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error connecting to reader stream.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workId]);

  const themeClasses: Record<ThemeMode, { container: string; text: string; header: string; meta: string }> = {
    light: {
      container: "bg-white",
      text: "text-gray-900",
      header: "bg-gray-100 border-gray-200 text-gray-800",
      meta: "bg-gray-50 border-gray-200 text-gray-600",
    },
    sepia: {
      container: "bg-[#fbf0d9]",
      text: "text-[#382b1d]",
      header: "bg-[#f0e2c2] border-[#decba5] text-[#382b1d]",
      meta: "bg-[#f5e9ce] border-[#decba5] text-[#54412c]",
    },
    dark: {
      container: "bg-[#161616]",
      text: "text-[#d8d8d8]",
      header: "bg-[#222222] border-[#333333] text-[#f0f0f0]",
      meta: "bg-[#1f1f1f] border-[#333333] text-[#aaaaaa]",
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
              <span className="truncate max-w-[200px] sm:max-w-[320px] font-medium hidden xs:inline">
                {data.title}
              </span>
            )}
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2 flex-wrap">
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
                className={`px-2 py-1 font-sans text-[11px] ${
                  fontFamily === "sans" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Sans-serif font (Modern clean)"
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`px-2 py-1 font-mono text-[11px] ${
                  fontFamily === "mono" ? "bg-ao3-red text-white" : "hover:bg-black/10"
                }`}
                title="Monospace font"
              >
                Mono
              </button>
            </div>

            {/* Font Size Adjusters */}
            <div className="flex items-center border border-gray-400/40 rounded overflow-hidden">
              <button
                onClick={() => setFontSizePx((prev) => Math.max(14, prev - 2))}
                className="px-2 py-1 hover:bg-black/10 text-[11px]"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="px-2 py-1 text-[10px] font-mono opacity-70">
                {fontSizePx}px
              </span>
              <button
                onClick={() => setFontSizePx((prev) => Math.min(28, prev + 2))}
                className="px-2 py-1 hover:bg-black/10 text-[11px]"
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
                  theme === "light" ? "bg-ao3-red text-white font-bold" : "hover:bg-black/10"
                }`}
                title="Light theme"
              >
                Day
              </button>
              <button
                onClick={() => setTheme("sepia")}
                className={`px-2 py-1 text-[11px] ${
                  theme === "sepia" ? "bg-[#d8c499] text-[#2b2014] font-bold" : "hover:bg-black/10"
                }`}
                title="Sepia parchment theme"
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-2 py-1 text-[11px] ${
                  theme === "dark" ? "bg-black text-white font-bold" : "hover:bg-black/10"
                }`}
                title="Dark night theme"
              >
                Night
              </button>
            </div>

            {/* Direct Takedown / Report Trigger */}
            <button
              onClick={() => setShowTakedownModal(true)}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-[11px] font-medium transition flex items-center gap-1"
              title="Report content or submit immediate author takedown"
            >
              <span>🚨</span> Takedown
            </button>
          </div>
        </div>
      </header>

      {/* Main Reading Container */}
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-3 border-ao3-red border-t-transparent rounded-full animate-spin" />
            <p className="text-sm opacity-75">
              Streaming sanitized document from Google Drive (Zero-Download)...
            </p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm space-y-3">
            <h3 className="font-bold text-base">Unable to Load Fanwork</h3>
            <p>{error}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-4 py-1.5 bg-ao3-red text-white rounded text-xs font-semibold hover:bg-ao3-darkred transition inline-block"
              >
                Return to Search Feed
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
                <div className="pt-2 border-t border-black/10 text-xs italic leading-relaxed opacity-90">
                  &ldquo;{data.summary}&rdquo;
                </div>
              )}

              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {data.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] bg-black/5 border border-black/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 text-[10px] opacity-70">
                🔒 <em>Ephemeral Read-Only Stream: No files are persisted on server disks.</em>
              </div>
            </header>

            {/* Document Content Display */}
            <section
              style={{ fontSize: `${fontSizePx}px` }}
              className={`pt-4 ${fontClasses[fontFamily]} ${currentTheme.text}`}
            >
              {data.isPdf && data.pdfPreviewUrl ? (
                <div className="w-full h-[80vh] border border-gray-300 rounded overflow-hidden">
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
                  className="prose prose-neutral max-w-none space-y-4 reader-content"
                />
              ) : (
                <div className="text-center py-12 opacity-60 text-sm">
                  No text content available in stream.
                </div>
              )}
            </section>

            {/* Reading Complete Footer */}
            <footer className="pt-12 border-t border-black/10 text-center text-xs opacity-75 space-y-3">
              <p>End of fanwork mirror.</p>
              <div>
                <Link
                  href="/"
                  className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white font-semibold rounded shadow-xs transition"
                >
                  &larr; Back to Library Search
                </Link>
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
