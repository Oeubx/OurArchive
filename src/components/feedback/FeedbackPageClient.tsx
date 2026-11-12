"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTimeAgo } from "@/lib/utils";
import { CreateFeedbackModal } from "./CreateFeedbackModal";
import type {
  FeedbackFeedResponse,
  FeedbackItemDto,
  FeedbackRatingFilter,
} from "@/types/feedback";

interface FeedbackPageClientProps {
  initialFeed: FeedbackFeedResponse;
  displayName: string;
  initialLoadError?: string | null;
}

const RATING_FILTER_OPTIONS: { value: FeedbackRatingFilter; label: string }[] = [
  { value: "all", label: "All Ratings" },
  { value: 5, label: "5 ★" },
  { value: 4, label: "4 ★" },
  { value: 3, label: "3 ★" },
  { value: 2, label: "2 ★" },
  { value: 1, label: "1 ★" },
];

export function FeedbackPageClient({
  initialFeed,
  displayName,
  initialLoadError = null,
}: FeedbackPageClientProps) {
  const router = useRouter();

  const [items, setItems] = useState<FeedbackItemDto[]>(initialFeed.items);
  const [totalCount, setTotalCount] = useState<number>(initialFeed.totalCount);
  const [page, setPage] = useState<number>(initialFeed.page);
  const [pageSize] = useState<number>(Math.max(5, initialFeed.pageSize));
  const [totalPages, setTotalPages] = useState<number>(initialFeed.totalPages);

  const [ratingFilter, setRatingFilter] = useState<FeedbackRatingFilter>("all");
  const [loadingList, setLoadingList] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialLoadError);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Enforce strict signed-in guard if session expires or user signs out while viewing /feedback
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/?auth_error=feedback_login_required");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchFeedbackPage = useCallback(
    async (targetPage: number, targetRating: FeedbackRatingFilter) => {
      setLoadingList(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(pageSize),
          rating: String(targetRating),
        });

        const res = await fetch(`/api/feedback?${params.toString()}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/?auth_error=feedback_login_required");
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load feedback.");
        }

        const feed = data as FeedbackFeedResponse;
        setItems(feed.items);
        setTotalCount(feed.totalCount);
        setPage(feed.page);
        setTotalPages(feed.totalPages);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load feedback.");
      } finally {
        setLoadingList(false);
      }
    },
    [pageSize, router]
  );

  function handleFilterChange(nextRating: FeedbackRatingFilter) {
    setRatingFilter(nextRating);
    setSuccessBanner(null);
    fetchFeedbackPage(1, nextRating);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || loadingList) return;
    fetchFeedbackPage(nextPage, ratingFilter);
  }

  async function handleCreateSuccess() {
    setModalOpen(false);
    setSuccessBanner("Thank you! Your feedback has been saved.");
    // Reset to All Ratings & Page 1 so the newly submitted feedback appears at the top
    setRatingFilter("all");
    await fetchFeedbackPage(1, "all");
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Breadcrumb & Header Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Feedback</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span aria-hidden="true">💬</span>
              <span>Community Feedback</span>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Share suggestions, bug reports, or rate your experience with OurArchive. Signed in as{" "}
              <strong className="text-gray-900 dark:text-gray-100">{displayName}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccessBanner(null);
              setModalOpen(true);
            }}
            className="w-full sm:w-auto min-h-[40px] px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>+</span>
            <span>Submit Feedback</span>
          </button>
        </div>
      </div>

      {/* Status Banners */}
      {successBanner && (
        <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2">
          <span>✅ {successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Rating Filter & List Container */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Submitted Feedback
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-subtle-light dark:bg-subtle-dark font-mono text-gray-600 dark:text-gray-400">
              {totalCount}
            </span>
          </div>

          {/* Responsive Rating Filter Pills (horizontal scroll on mobile, wrap on sm+) */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter feedback by rating"
          >
            {RATING_FILTER_OPTIONS.map((opt) => {
              const isActive = ratingFilter === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleFilterChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                    isActive
                      ? "bg-brand-trunk text-white shadow-2xs"
                      : "bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Items List */}
        {loadingList ? (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 sm:p-5 space-y-2.5 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
                  <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 sm:p-12 text-center space-y-3">
            <div className="text-3xl" aria-hidden="true">📭</div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {ratingFilter === "all"
                ? "No Feedback Submitted Yet"
                : `No ${ratingFilter}-Star Feedback Found`}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {ratingFilter === "all"
                ? "Be the first signed-in member to share feedback about OurArchive."
                : "Try selecting another rating filter or reset to All Ratings."}
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {ratingFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => handleFilterChange("all")}
                  className="px-3.5 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-subtle-light dark:hover:bg-subtle-dark transition cursor-pointer"
                >
                  Show All Ratings
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                + Submit Feedback
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {items.map((item) => (
              <article
                key={item.id}
                className="p-4 sm:p-5 space-y-2.5 hover:bg-subtle-light/35 dark:hover:bg-subtle-dark/35 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 break-words min-w-0">
                    {item.subject}
                  </h3>

                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 shrink-0 self-start"
                    aria-label={`Rated ${item.rating} out of 5`}
                  >
                    <span className="text-amber-500 text-xs tracking-tight" aria-hidden="true">
                      {"★".repeat(item.rating)}
                      <span className="text-gray-300 dark:text-gray-600">
                        {"★".repeat(5 - item.rating)}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-brand-bark dark:text-amber-200 font-mono">
                      ({item.rating}/5)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-line">
                  {item.description}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span aria-hidden="true">{item.isAnonymous ? "🕶️" : "👤"}</span>
                    <span
                      className={
                        item.isAnonymous
                          ? "italic text-gray-500 dark:text-gray-400"
                          : "font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]"
                      }
                    >
                      {item.authorName}
                    </span>
                  </div>
                  <time
                    dateTime={item.createdAt}
                    title={new Date(item.createdAt).toLocaleString()}
                    className="font-mono text-[10px] sm:text-[11px]"
                  >
                    {formatTimeAgo(item.createdAt)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom Arrow Pagination Bar (5 items per page minimum) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-3 border-t border-border-light dark:border-border-dark bg-subtle-light/40 dark:bg-subtle-dark/40 text-xs">
          <div className="text-gray-500 dark:text-gray-400 text-[11px] text-center sm:text-left">
            {totalCount === 0
              ? "Showing 0 feedbacks"
              : `Showing ${rangeStart}–${rangeEnd} of ${totalCount} feedback${totalCount === 1 ? "" : "s"}`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loadingList}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer disabled:cursor-not-allowed"
              aria-label="Previous feedback page"
            >
              &larr; Prev
            </button>
            <span className="text-gray-600 dark:text-gray-300 font-medium text-[11px] px-1">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loadingList}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer disabled:cursor-not-allowed"
              aria-label="Next feedback page"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Create Feedback Modal */}
      <CreateFeedbackModal
        isOpen={modalOpen}
        displayName={displayName}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
