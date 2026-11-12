"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TakedownModal } from "@/components/takedown/TakedownModal";
import { DirectTakedownEmailModal } from "@/components/takedown/DirectTakedownEmailModal";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeDriveLinks } from "@/lib/hooks/useRealtimeDriveLinks";
import { unmaskWorkId } from "@/lib/utils/idMasker";
import {
  fetchBookmarkForWorkFromApi,
  saveBookmarkToApi,
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
  isNativePdf?: boolean;
  totalPages?: number;
  isFolder?: boolean;
  collectionWorks?: CollectionChildWork[];
  pdfPreviewUrl?: string | null;
  drivePreviewUrl?: string | null;
  contentHtml?: string | null;
  plainContentHtml?: string | null;
  rawDriveUrl?: string;
  uploaderUserId?: string;
}

type FontFamily = "serif" | "sans" | "mono";
type ThemeMode = "light" | "warm" | "dark";
type ReaderViewMode = "formatted" | "plain" | "drive";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = params?.id as string;
  const unmaskedWorkId = unmaskWorkId(workId || "");

  const [data, setData] = useState<ReaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [showDirectEmailModal, setShowDirectEmailModal] = useState(false);

  // Realtime Takedown/Suppression Interruption Modal State
  const [interruptedReason, setInterruptedReason] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  // Authentic Supabase Auth State
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | "guest">("guest");

  // Collection State (Solution A: Folder Indexing & Table of Contents)
  const [selectedChildWork, setSelectedChildWork] = useState<CollectionChildWork | null>(null);
  const [collectionFilter, setCollectionFilter] = useState("");
  const [streamingChild, setStreamingChild] = useState(false);

  // Bookmark State
  const [existingBookmark, setExistingBookmark] = useState<ReaderBookmark | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [bookmarkSavedFeedback, setBookmarkSavedFeedback] = useState(false);
  const [pdfPageInput, setPdfPageInput] = useState<number>(1);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialChildAppliedRef = useRef(false);

  // Reader customization state
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [fontSizePx, setFontSizePx] = useState<number>(18);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [viewMode, setViewMode] = useState<ReaderViewMode>("formatted");

  // Synchronize initial theme and view mode with global stored preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ourarchive_theme");
      const isSystemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (stored === "dark" || (!stored && isSystemDark)) {
        setTheme("dark");
      } else if (stored === "warm" || stored === "sepia") {
        setTheme("warm");
      } else {
        setTheme("light");
      }

      const storedViewMode = localStorage.getItem("ourarchive_reader_view_mode");
      if (storedViewMode === "formatted" || storedViewMode === "plain" || storedViewMode === "drive") {
        setViewMode(storedViewMode);
      }
    }
  }, []);

  // Synchronize document body and root background with reader theme to eliminate margin gutters on wide screens
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyColor = document.body.style.color;
    const prevDocBg = document.documentElement.style.backgroundColor;

    const bgMap: Record<ThemeMode, { bg: string; color: string; isDark: boolean }> = {
      light: { bg: "#f8f9fa", color: "#111827", isDark: false },
      warm: { bg: "#f7edd5", color: "#382b1d", isDark: false },
      dark: { bg: "#121214", color: "#ededed", isDark: true },
    };

    const target = bgMap[theme];
    document.body.style.backgroundColor = target.bg;
    document.body.style.color = target.color;
    document.documentElement.style.backgroundColor = target.bg;

    // Synchronize Tailwind dark mode class with root HTML element
    if (target.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.color = prevBodyColor;
      document.documentElement.style.backgroundColor = prevDocBg;
    };
  }, [theme]);

  // Authenticate Supabase user session & role cleanly
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!active || !user) return;
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        setRole(profile?.role === "admin" ? "admin" : "contributor");
      })
      .catch(() => {
        if (active) {
          setUserId(null);
          setUserEmail(null);
          setRole("guest");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to Realtime database changes: interrupt & purge reader DOM if admin hides/removes mid-read
  useRealtimeDriveLinks(
    (payload) => {
      if (interruptedReason) return;
      const newRow = payload.new as {
        id?: string;
        is_hidden?: boolean;
        is_removed?: boolean;
        verification_status?: string;
      } | null;
      const oldRow = payload.old as { id?: string } | null;

      const isTarget =
        newRow?.id === unmaskedWorkId || oldRow?.id === unmaskedWorkId;
      if (!isTarget) return;

      const isSuppressed =
        payload.eventType === "DELETE" ||
        Boolean(newRow?.is_hidden) ||
        Boolean(newRow?.is_removed) ||
        newRow?.verification_status === "rejected" ||
        newRow?.verification_status === "flagged";

      if (isSuppressed) {
        setData(null);
        setSelectedChildWork(null);
        setLoading(false);
        setRedirectCountdown(5);
        setInterruptedReason(
          payload.eventType === "DELETE" || newRow?.is_removed
            ? "This fanwork was permanently removed by an administrator or author takedown."
            : "This fanwork has been temporarily hidden or quarantined by an administrator."
        );
      }
    },
    {
      filter: unmaskedWorkId ? `id=eq.${unmaskedWorkId}` : undefined,
      enabled: Boolean(unmaskedWorkId),
    }
  );

  // Auto-redirect countdown once reader session is interrupted
  useEffect(() => {
    if (!interruptedReason) return;
    if (redirectCountdown <= 0) {
      router.replace("/search");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [interruptedReason, redirectCountdown, router]);

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

  // Check for saved reading bookmark in Supabase on load
  useEffect(() => {
    if (!workId || !userId) return;
    let active = true;
    fetchBookmarkForWorkFromApi(workId)
      .then((b) => {
        if (!active || !b) return;
        setExistingBookmark(b);
        if (b.isPdf && b.lastPage) {
          setPdfPageInput(b.lastPage);
        }
        if (b.scrollPercent > 5 || b.lastPage > 1 || Boolean(b.childId)) {
          setShowResumeBanner(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [workId, userId]);

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
                  isNativePdf: json.isNativePdf,
                  totalPages: json.totalPages,
                  pdfPreviewUrl: json.pdfPreviewUrl,
                  drivePreviewUrl: json.drivePreviewUrl,
                  contentHtml: json.contentHtml,
                  plainContentHtml: json.plainContentHtml,
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

  // Auto-open collection child if navigated with ?childId=...
  useEffect(() => {
    if (!data || initialChildAppliedRef.current) return;
    const childIdParam = searchParams?.get("childId");
    if (!childIdParam) return;
    initialChildAppliedRef.current = true;
    const matchedFromList = data.collectionWorks?.find((w) => w.id === childIdParam);
    const child: CollectionChildWork = matchedFromList || {
      id: childIdParam,
      title: searchParams?.get("childTitle") || "Bookmarked Chapter",
      fileName: "",
      mimeType: searchParams?.get("mimeType") || "application/pdf",
      sizeBytes: 0,
    };
    handleSelectChildWork(child);
  }, [data, searchParams, handleSelectChildWork]);

  // Jump to saved position (or open saved collection chapter)
  const handleResumeReading = useCallback(() => {
    if (!existingBookmark) return;
    if (
      existingBookmark.childId &&
      selectedChildWork?.id !== existingBookmark.childId
    ) {
      handleSelectChildWork({
        id: existingBookmark.childId,
        title: existingBookmark.childTitle || "Bookmarked Work",
        fileName: "",
        mimeType: existingBookmark.childMimeType || "application/pdf",
        sizeBytes: 0,
      });
    }
    if (!existingBookmark.isPdf) {
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = scrollMax * (existingBookmark.scrollPercent / 100);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
    setShowResumeBanner(false);
  }, [existingBookmark, selectedChildWork, handleSelectChildWork]);

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

  // Save bookmark progress to Supabase (`public.user_bookmarks`)
  const saveCurrentProgress = useCallback(
    async (manual: boolean = false) => {
      if (!data || !userId) return;
      if (data.isPdf && !manual) return; // Cross-origin PDF iframes cannot auto-track scroll

      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = data.isPdf
        ? 0
        : scrollMax > 0
        ? Math.min(100, Math.max(0, Math.round((window.scrollY / scrollMax) * 100)))
        : 0;

      const totalPages = Math.max(1, Math.ceil((data.wordCount || 2500) / 350));
      const lastPage = data.isPdf
        ? Math.max(1, Math.floor(Number(pdfPageInput) || 1))
        : Math.max(1, Math.ceil((scrollPercent / 100) * totalPages));

      const bookmark: ReaderBookmark = {
        workId: data.workId,
        title: data.title,
        authorName: data.authorName,
        fandom: data.fandom,
        scrollPercent,
        lastPage,
        updatedAt: new Date().toISOString(),
        isPdf: Boolean(data.isPdf),
        childId: selectedChildWork?.id,
        childTitle: selectedChildWork?.title,
        childMimeType: selectedChildWork?.mimeType,
      };

      try {
        const saved = await saveBookmarkToApi(bookmark);
        if (saved) setExistingBookmark(saved);
        if (manual) {
          setBookmarkSavedFeedback(true);
          setTimeout(() => setBookmarkSavedFeedback(false), 2000);
        }
      } catch (err) {
        if (manual) {
          console.error("Failed to save bookmark:", err);
        }
      }
    },
    [data, userId, pdfPageInput, selectedChildWork]
  );

  // Debounced auto-save on scroll for authenticated HTML document readers
  useEffect(() => {
    if (!userId || !data || data.isPdf || data.isFolder) return;

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
  }, [userId, data, saveCurrentProgress]);

  // URL Privacy check: Only Admin or Verifier can see raw external drive links
  const canRevealDrive = role === "admin" || role === "verifier";

  interface ReaderThemeConfig {
    container: string;
    text: string;
    textMuted: string;
    header: string;
    brandLink: string;
    toolbarGroup: string;
    toolbarBtn: string;
    toolbarBtnActive: string;
    toolbarBtnHover: string;
    toolbarDivider: string;
    bookmarkBtn: string;
    metaBox: string;
    metaTitle: string;
    metaBorder: string;
    metaTag: string;
    collectionHeader: string;
    collectionInput: string;
    collectionCard: string;
    collectionCardTitle: string;
    collectionCardMuted: string;
    collectionCardAction: string;
    collectionBanner: string;
    collectionBannerText: string;
    collectionBannerBtn: string;
    badgePdf: string;
    badgeDoc: string;
    footerBorder: string;
    footerBtnSecondary: string;
    emptyBox: string;
  }

  const themeClasses: Record<ThemeMode, ReaderThemeConfig> = {
    light: {
      container: "bg-[#f8f9fa] text-gray-900",
      text: "text-gray-900",
      textMuted: "text-gray-600",
      header: "bg-white/95 border-gray-200 text-gray-800 shadow-2xs",
      brandLink: "text-brand-trunk hover:text-brand-bark",
      toolbarGroup: "bg-gray-100 border-gray-300/80 text-gray-700",
      toolbarBtn: "text-gray-700 hover:bg-gray-200/80 transition-colors",
      toolbarBtnActive: "bg-brand-trunk text-white shadow-2xs",
      toolbarBtnHover: "hover:bg-gray-200/80",
      toolbarDivider: "border-gray-300/80",
      bookmarkBtn: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-2xs",
      metaBox: "bg-white border-gray-200 text-gray-800 shadow-xs",
      metaTitle: "text-gray-900",
      metaBorder: "border-gray-200",
      metaTag: "bg-gray-100 border-gray-200 text-gray-700",
      collectionHeader: "bg-white border-gray-200 text-gray-900 shadow-xs",
      collectionInput: "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-brand-trunk focus:ring-1 focus:ring-brand-trunk",
      collectionCard: "bg-white border-gray-200 text-gray-900 shadow-xs hover:border-brand-trunk/50 hover:bg-amber-50/30",
      collectionCardTitle: "text-gray-900 group-hover:text-brand-trunk",
      collectionCardMuted: "text-gray-500",
      collectionCardAction: "text-brand-trunk group-hover:text-brand-bark",
      collectionBanner: "bg-amber-50 border-amber-200/80 text-amber-950 shadow-xs",
      collectionBannerText: "text-amber-900",
      collectionBannerBtn: "text-brand-trunk hover:text-brand-bark",
      badgePdf: "bg-red-50 text-red-700 border-red-200",
      badgeDoc: "bg-blue-50 text-blue-700 border-blue-200",
      footerBorder: "border-gray-200",
      footerBtnSecondary: "border-gray-300 text-gray-700 hover:bg-gray-100 bg-white",
      emptyBox: "border-gray-300 bg-white text-gray-500",
    },
    warm: {
      container: "bg-[#f7edd5] text-[#382b1d]",
      text: "text-[#382b1d]",
      textMuted: "text-[#70563b]",
      header: "bg-[#eeddb8]/95 border-[#dec79e] text-[#382b1d] shadow-2xs",
      brandLink: "text-brand-trunk hover:text-brand-bark",
      toolbarGroup: "bg-[#e5d0a6] border-[#cfb686] text-[#382b1d]",
      toolbarBtn: "text-[#382b1d] hover:bg-[#d8be8d] transition-colors",
      toolbarBtnActive: "bg-brand-trunk text-white shadow-2xs",
      toolbarBtnHover: "hover:bg-[#d8be8d]",
      toolbarDivider: "border-[#cfb686]",
      bookmarkBtn: "bg-[#fbf3e0] border-[#cfb686] text-[#382b1d] hover:bg-[#f2e2be] shadow-2xs",
      metaBox: "bg-[#fcf5e5] border-[#dfcca4] text-[#382b1d] shadow-xs",
      metaTitle: "text-[#382b1d]",
      metaBorder: "border-[#dfcca4]",
      metaTag: "bg-[#ebd7b0] border-[#dfcca4] text-[#382b1d]",
      collectionHeader: "bg-[#fcf5e5] border-[#dfcca4] text-[#382b1d] shadow-xs",
      collectionInput: "bg-[#fdf9ee] border-[#cfb686] text-[#382b1d] placeholder:text-[#9e8363] focus:border-brand-trunk focus:ring-1 focus:ring-brand-trunk",
      collectionCard: "bg-[#fdf9ee] border-[#dfcca4] text-[#382b1d] shadow-xs hover:border-brand-trunk/60 hover:bg-[#f6ebd1]",
      collectionCardTitle: "text-[#382b1d] group-hover:text-brand-trunk",
      collectionCardMuted: "text-[#7a6044]",
      collectionCardAction: "text-brand-trunk group-hover:text-brand-bark",
      collectionBanner: "bg-[#f2e2bf] border-[#dfcca4] text-[#382b1d] shadow-xs",
      collectionBannerText: "text-[#382b1d]",
      collectionBannerBtn: "text-brand-trunk hover:text-brand-bark",
      badgePdf: "bg-[#fbe5e1] text-[#9c2b1f] border-[#e8b5ad]",
      badgeDoc: "bg-[#e2edf9] text-[#1e528a] border-[#b4d0ed]",
      footerBorder: "border-[#dfcca4]",
      footerBtnSecondary: "border-[#cfb686] text-[#382b1d] hover:bg-[#ebd7b0] bg-[#fdf9ee]",
      emptyBox: "border-[#cfb686] bg-[#fcf5e5] text-[#7a6044]",
    },
    dark: {
      container: "bg-[#121214] text-[#ededed]",
      text: "text-[#ededed]",
      textMuted: "text-gray-400",
      header: "bg-[#1a1a1e]/95 border-[#2a2a30] text-[#ededed] shadow-2xs",
      brandLink: "text-brand-light hover:text-white",
      toolbarGroup: "bg-[#25252b] border-[#383842] text-gray-300",
      toolbarBtn: "text-gray-300 hover:bg-[#34343d] transition-colors",
      toolbarBtnActive: "bg-brand-trunk text-white shadow-2xs",
      toolbarBtnHover: "hover:bg-[#34343d]",
      toolbarDivider: "border-[#383842]",
      bookmarkBtn: "bg-[#25252b] border-[#383842] text-gray-200 hover:bg-[#34343d] shadow-2xs",
      metaBox: "bg-[#18181c] border-[#2a2a30] text-[#ededed] shadow-xs",
      metaTitle: "text-white",
      metaBorder: "border-[#2a2a30]",
      metaTag: "bg-[#25252b] border-[#383842] text-gray-300",
      collectionHeader: "bg-[#18181c] border-[#2a2a30] text-[#ededed] shadow-xs",
      collectionInput: "bg-[#25252b] border-[#383842] text-gray-100 placeholder:text-gray-500 focus:border-brand-light focus:ring-1 focus:ring-brand-light",
      collectionCard: "bg-[#1a1a1f] border-[#2e2e38] text-gray-100 shadow-xs hover:border-brand-amber/50 hover:bg-[#25252d]",
      collectionCardTitle: "text-gray-100 group-hover:text-brand-light",
      collectionCardMuted: "text-gray-400",
      collectionCardAction: "text-brand-light group-hover:text-white",
      collectionBanner: "bg-[#201d1b] border-brand-trunk/40 text-brand-light shadow-xs",
      collectionBannerText: "text-brand-light",
      collectionBannerBtn: "text-amber-200 hover:text-white",
      badgePdf: "bg-red-950/70 text-red-300 border-red-900/70",
      badgeDoc: "bg-blue-950/70 text-blue-300 border-blue-900/70",
      footerBorder: "border-[#2a2a30]",
      footerBtnSecondary: "border-[#383842] text-gray-300 hover:bg-[#25252b] bg-[#1a1a1f]",
      emptyBox: "border-[#383842] bg-[#18181c] text-gray-400",
    },
  };

  const fontClasses: Record<FontFamily, string> = {
    serif: "font-serif leading-relaxed",
    sans: "font-sans leading-relaxed",
    mono: "font-mono leading-normal",
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`min-h-screen overflow-x-clip transition-colors duration-200 -mx-4 -my-4 p-4 ${currentTheme.container}`}>
      {/* Sticky Reader Toolbar docked under the main Header without overlapping */}
      <header className={`sticky top-[53px] sm:top-[57px] z-30 border-b py-2.5 px-4 backdrop-blur-md shadow-xs ${currentTheme.header}`}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`font-semibold flex items-center gap-1 transition ${currentTheme.brandLink}`}
            >
              <span>&larr;</span> Library Index
            </Link>
            {data && (
              <span className={`truncate max-w-[180px] sm:max-w-[260px] font-medium hidden xs:inline ${currentTheme.textMuted}`}>
                {data.title}
              </span>
            )}
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOOKMARK BUTTON (Authenticated users only, Supabase-persisted) */}
            {userId ? (
              <div className="flex items-center gap-1.5">
                {data?.isPdf && (
                  <label
                    className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[11px] ${currentTheme.toolbarGroup}`}
                    title="Google Drive PDF previews cannot expose internal scroll position; enter your page checkpoint manually"
                  >
                    <span className="text-[10px] opacity-80">Pg</span>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={pdfPageInput}
                      onChange={(e) =>
                        setPdfPageInput(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      aria-label="PDF Page Number"
                      className="w-11 bg-transparent text-center font-mono text-[11px] focus:outline-hidden"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => saveCurrentProgress(true)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition flex items-center gap-1 ${
                    bookmarkSavedFeedback
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : currentTheme.bookmarkBtn
                  }`}
                  title={
                    data?.isPdf
                      ? "Save manual PDF page checkpoint to your Supabase bookmarks"
                      : "Save current reading position to your Supabase bookmarks"
                  }
                >
                  <span>🔖</span>
                  <span>{bookmarkSavedFeedback ? "Saved!" : "Bookmark"}</span>
                </button>
              </div>
            ) : (
              <span
                className={`text-[10px] italic hidden sm:inline ${currentTheme.textMuted}`}
                title="Sign in to save reading bookmarks across devices"
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
            <div className={`flex items-center border rounded overflow-hidden shadow-2xs ${currentTheme.toolbarGroup}`}>
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-2 py-1 font-serif text-[11px] font-medium transition ${
                  fontFamily === "serif" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Serif font (Book style)"
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-2 py-1 font-sans text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                  fontFamily === "sans" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Sans font (Modern)"
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`px-2 py-1 font-mono text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                  fontFamily === "mono" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Mono font (Code/Draft)"
              >
                Mono
              </button>
            </div>

            {/* Font Size Adjusters */}
            <div className={`flex items-center border rounded overflow-hidden shadow-2xs ${currentTheme.toolbarGroup}`}>
              <button
                onClick={() => setFontSizePx((prev) => Math.max(14, prev - 2))}
                className={`px-2.5 py-1 text-xs font-bold transition ${currentTheme.toolbarBtn}`}
                title="Decrease font size"
              >
                A-
              </button>
              <span className={`px-1.5 text-[10px] font-mono font-semibold ${currentTheme.textMuted}`}>
                {fontSizePx}px
              </span>
              <button
                onClick={() => setFontSizePx((prev) => Math.min(28, prev + 2))}
                className={`px-2.5 py-1 text-xs font-bold border-l transition ${currentTheme.toolbarDivider} ${currentTheme.toolbarBtn}`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Theme Selector: LIGHT - WARM - DARK */}
            <div className={`flex items-center border rounded overflow-hidden shadow-2xs ${currentTheme.toolbarGroup}`}>
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  localStorage.setItem("ourarchive_theme", "light");
                }}
                className={`px-2 py-1 text-[11px] font-medium transition ${
                  theme === "light" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Light mode (Clean Paper)"
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme("warm");
                  localStorage.setItem("ourarchive_theme", "warm");
                }}
                className={`px-2 py-1 text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                  theme === "warm" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Warm mode (Parchment Book Paper)"
              >
                Warm
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  localStorage.setItem("ourarchive_theme", "dark");
                }}
                className={`px-2 py-1 text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                  theme === "dark" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                }`}
                title="Dark mode (Obsidian Charcoal)"
              >
                Dark
              </button>
            </div>

            {/* Reader View Mode Selector: Formatted | Plain | Drive */}
            {!data?.isFolder && (data?.contentHtml || data?.drivePreviewUrl || data?.pdfPreviewUrl) && (
              <div className={`flex items-center border rounded overflow-hidden shadow-2xs ${currentTheme.toolbarGroup}`}>
                {data?.contentHtml && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("formatted");
                      localStorage.setItem("ourarchive_reader_view_mode", "formatted");
                    }}
                    className={`px-2 py-1 text-[11px] font-medium transition ${
                      viewMode === "formatted" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                    }`}
                    title="Formatted native view (preserves spacing and paragraphs)"
                  >
                    Formatted
                  </button>
                )}
                {data?.plainContentHtml && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("plain");
                      localStorage.setItem("ourarchive_reader_view_mode", "plain");
                    }}
                    className={`px-2 py-1 text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                      viewMode === "plain" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                    }`}
                    title="Compact plain text stream"
                  >
                    Plain
                  </button>
                )}
                {(data?.drivePreviewUrl || data?.pdfPreviewUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("drive");
                      localStorage.setItem("ourarchive_reader_view_mode", "drive");
                    }}
                    className={`px-2 py-1 text-[11px] font-medium border-l transition ${currentTheme.toolbarDivider} ${
                      viewMode === "drive" ? currentTheme.toolbarBtnActive : currentTheme.toolbarBtn
                    }`}
                    title="Original Google Drive file preview"
                  >
                    Drive
                  </button>
                )}
              </div>
            )}

            {/* Report Takedown Button: Signed-in -> Instant Form, Unsigned -> Method 2 Direct Email */}
            <button
              onClick={() => {
                if (userId) {
                  setShowTakedownModal(true);
                } else {
                  setShowDirectEmailModal(true);
                }
              }}
              className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded text-xs font-medium transition"
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
          className={`max-w-2xl mx-auto my-3 p-3 rounded-lg flex items-center justify-between gap-3 text-xs shadow-xs animate-in slide-in-from-top-2 duration-200 border ${currentTheme.collectionBanner}`}
        >
          <div className={`flex items-center gap-2 ${currentTheme.collectionBannerText}`}>
            <span className="text-base">🔖</span>
            <span>
              Welcome back! Saved at <strong>Page {existingBookmark.lastPage}</strong>
              {existingBookmark.childTitle
                ? ` in "${existingBookmark.childTitle}"`
                : existingBookmark.isPdf
                ? " (PDF checkpoint)"
                : ` (${existingBookmark.scrollPercent}% completed)`}
              .
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
              className="p-1 opacity-70 hover:opacity-100 text-xs transition-opacity"
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

        {error && !data && !interruptedReason && (
          <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-lg text-center space-y-3">
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
            <header className={`p-6 rounded-lg border space-y-3 transition-colors ${currentTheme.metaBox}`}>
              <div className="space-y-1">
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${currentTheme.metaTitle}`}>
                  {data.title}
                </h1>
                <p className={`text-sm ${currentTheme.textMuted}`}>
                  by <strong className={`font-semibold underline ${currentTheme.text}`}>{data.authorName}</strong>
                </p>
              </div>

              <div className={`text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 ${currentTheme.textMuted}`}>
                <span>
                  <strong className={currentTheme.text}>Fandom:</strong> {data.fandom}
                </span>
                {data.pairing && (
                  <span>
                    <strong className={currentTheme.text}>Pairing:</strong> {data.pairing}
                  </span>
                )}
                <span>
                  <strong className={currentTheme.text}>Rating:</strong> {data.rating}
                </span>
                <span>
                  <strong className={currentTheme.text}>Words:</strong> {data.wordCount.toLocaleString()}
                </span>
              </div>

              {data.summary && (
                <div className={`pt-2 border-t text-xs italic leading-relaxed ${currentTheme.metaBorder} ${currentTheme.textMuted}`}>
                  &ldquo;{data.summary}&rdquo;
                </div>
              )}

              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {data.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[10px] border ${currentTheme.metaTag}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className={`pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2 border-t ${currentTheme.metaBorder} ${currentTheme.textMuted}`}>
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
                      className={`font-medium hover:underline ${currentTheme.brandLink}`}
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
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border transition-colors ${currentTheme.collectionHeader}`}>
                  <div>
                    <h2 className={`text-base font-bold flex items-center gap-2 ${currentTheme.collectionCardTitle}`}>
                      <span>📁</span> Collection Table of Contents
                    </h2>
                    <p className={`text-xs mt-0.5 ${currentTheme.collectionCardMuted}`}>
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
                      className={`px-3 py-1.5 text-xs rounded border transition-colors focus:outline-hidden ${currentTheme.collectionInput}`}
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
                          className={`group flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${currentTheme.collectionCard}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                work.mimeType.includes("pdf")
                                  ? currentTheme.badgePdf
                                  : currentTheme.badgeDoc
                              }`}
                            >
                              {work.mimeType.includes("pdf") ? "PDF" : "DOC"}
                            </span>
                            <div className="min-w-0">
                              <h3 className={`text-sm font-semibold transition truncate ${currentTheme.collectionCardTitle}`}>
                                {work.title}
                              </h3>
                              <p className={`text-[11px] truncate ${currentTheme.collectionCardMuted}`}>
                                {work.fileName} {work.sizeBytes > 0 && `• ${(work.sizeBytes / 1024).toFixed(0)} KB`}
                              </p>
                            </div>
                          </div>

                          <div className={`shrink-0 flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform ${currentTheme.collectionCardAction}`}>
                            <span>Read</span>
                            <span>&rarr;</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-lg border border-dashed space-y-2 ${currentTheme.emptyBox}`}>
                    <p className="text-sm">
                      This folder either contains sub-folders, unsupported file formats, or is private.
                    </p>
                    <p className="text-xs opacity-75">
                      Ensure the Google Drive permissions are set to &quot;Anyone with the link can view&quot;.
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Active Child Work Banner (when reading inside a collection) */}
                {selectedChildWork && (
                  <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${currentTheme.collectionBanner}`}>
                    <div className={`flex items-center gap-2 truncate ${currentTheme.collectionBannerText}`}>
                      <span>📁</span>
                      <span>
                        Part of collection: <strong className="font-semibold underline">{data.title}</strong>
                      </span>
                    </div>
                    <button
                      onClick={handleBackToCollection}
                      className={`shrink-0 font-semibold underline ml-2 transition ${currentTheme.collectionBannerBtn}`}
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
                    {viewMode === "drive" && (data.drivePreviewUrl || data.pdfPreviewUrl) ? (
                      <div className={`w-full h-[80vh] border rounded overflow-hidden shadow-xs ${currentTheme.metaBorder}`}>
                        <iframe
                          src={(data.drivePreviewUrl || data.pdfPreviewUrl) as string}
                          title={data.title}
                          className="w-full h-full"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    ) : viewMode === "plain" && data.plainContentHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: data.plainContentHtml }}
                        className="prose prose-neutral dark:prose-invert max-w-none space-y-4 reader-content"
                      />
                    ) : data.contentHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: data.contentHtml }}
                        className="prose prose-neutral dark:prose-invert max-w-none space-y-4 reader-content"
                      />
                    ) : data.isPdf && (data.drivePreviewUrl || data.pdfPreviewUrl) ? (
                      <div className="space-y-2">
                        <div className={`text-[11px] px-3 py-1.5 rounded border ${currentTheme.collectionBanner} ${currentTheme.collectionBannerText}`}>
                          Scanned/Image PDF fallback active — font controls apply to text-extractable works.
                        </div>
                        <div className={`w-full h-[80vh] border rounded overflow-hidden shadow-xs ${currentTheme.metaBorder}`}>
                          <iframe
                            src={(data.drivePreviewUrl || data.pdfPreviewUrl) as string}
                            title={data.title}
                            className={`w-full h-full transition ${
                              theme === "dark"
                                ? "invert-[0.9] hue-rotate-180"
                                : theme === "warm"
                                ? "sepia-[0.25]"
                                : ""
                            }`}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      </div>
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
            <footer className={`pt-12 border-t text-center text-xs space-y-3 ${currentTheme.footerBorder} ${currentTheme.textMuted}`}>
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
                    className={`px-4 py-2 border rounded transition ${currentTheme.footerBtnSecondary}`}
                  >
                    View Original Drive Link (Admin)
                  </a>
                )}
              </div>
            </footer>
          </article>
        )}
      </main>

      {/* Takedown Modal in Reader (Signed-in Users) */}
      <TakedownModal
        isOpen={showTakedownModal}
        workId={workId}
        workTitle={selectedChildWork ? selectedChildWork.title || selectedChildWork.fileName : data?.title}
        userEmail={userEmail}
        onClose={() => setShowTakedownModal(false)}
      />

      {/* Direct Email Takedown Modal in Reader (Unsigned Users - Method 2) */}
      <DirectTakedownEmailModal
        isOpen={showDirectEmailModal}
        onClose={() => setShowDirectEmailModal(false)}
        workTitle={selectedChildWork ? selectedChildWork.title || selectedChildWork.fileName : data?.title}
      />

      {/* Real-Time Reader Interruption Modal (When Admin Hides or Purges Mid-Read) */}
      {interruptedReason && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reader-interrupted-title"
        >
          <div className="bg-surface-light dark:bg-surface-dark border border-red-300 dark:border-red-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 text-center space-y-4">
            <div className="text-4xl">🛑</div>
            <h2
              id="reader-interrupted-title"
              className="text-lg font-bold text-gray-900 dark:text-gray-100"
            >
              Content No Longer Available
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {interruptedReason}
            </p>
            <p className="text-[11px] font-mono text-brand-trunk dark:text-brand-light">
              Redirecting to Library Search in {redirectCountdown}s...
            </p>
            <button
              type="button"
              onClick={() => router.replace("/search")}
              className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              Return to Search Now &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
