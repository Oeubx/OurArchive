"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SearchSection } from "@/components/search/SearchSection";
import type { SearchFilters } from "@/components/search/SearchSection";
import { DisplayCard } from "@/components/cards/DisplayCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { MaskedDriveRevealModal } from "@/components/modals/MaskedDriveRevealModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { AssistedIntakeModal } from "@/components/upload/AssistedIntakeModal";
import { TakedownModal } from "@/components/takedown/TakedownModal";
import { ContributorAuthGateModal } from "@/components/contribute/ContributorAuthGateModal";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeDriveLinks } from "@/lib/hooks/useRealtimeDriveLinks";
import type { PublicSearchFeedRecord } from "@/types/database";

export default function SearchPage() {
  const [works, setWorks] = useState<PublicSearchFeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [revealWorkId, setRevealWorkId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGuestGateModal, setShowGuestGateModal] = useState(false);
  const [showAssistedModal, setShowAssistedModal] = useState(false);
  const [takedownWork, setTakedownWork] = useState<{ id: string; title: string } | null>(null);

  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    q: "",
    fandom: "",
    rating: "All",
    tag: "",
    contentFilter: "all",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchWorks = useCallback(async (filters: SearchFilters, page = 1, limit = pageSize) => {
    // Abort prior in-flight search request to prevent stale race conditions and database congestion
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.fandom) params.set("fandom", filters.fandom);
      if (filters.rating && filters.rating !== "All") params.set("rating", filters.rating);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.category && filters.category !== "All") params.set("category", filters.category);
      if (filters.warning && filters.warning !== "All") params.set("warning", filters.warning);
      if (filters.character) params.set("character", filters.character);
      if (filters.relationship) params.set("relationship", filters.relationship);
      if (filters.isComplete && filters.isComplete !== "all") params.set("isComplete", filters.isComplete);
      if (typeof filters.minWords === "number") params.set("minWords", filters.minWords.toString());
      if (typeof filters.maxWords === "number") params.set("maxWords", filters.maxWords.toString());
      if (filters.contentFilter && filters.contentFilter !== "all") {
        params.set("contentFilter", filters.contentFilter);
      }
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      const json = await res.json();

      if (res.ok) {
        setWorks(json.works || []);
        setPagination(
          json.pagination || {
            page: 1,
            totalPages: Math.max(1, Math.ceil((json.works?.length || 0) / limit)),
            total: json.works?.length || 0,
          }
        );
      } else {
        setError(json.error || "Failed to retrieve archive search results from database.");
        setWorks([]);
        setPagination({ page: 1, totalPages: 1, total: 0 });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Ignored; a newer auto-search query was fired
        return;
      }
      setError(err instanceof Error ? err.message : "Error connecting to search service.");
      setWorks([]);
      setPagination({ page: 1, totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchWorks(currentFilters, 1);
  }, [fetchWorks, currentFilters]);

  // Track authentication state for link contribution
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(Boolean(user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time synchronization: Silently re-query library when works are approved, modified, or removed
  useRealtimeDriveLinks(() => {
    fetchWorks(currentFilters, pagination.page, pageSize);
  });

  function handleSearch(filters: SearchFilters) {
    setCurrentFilters(filters);
    fetchWorks(filters, 1, pageSize);
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    fetchWorks(currentFilters, 1, newSize);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    fetchWorks(currentFilters, newPage, pageSize);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6 py-2">
      {/* Search Header Banner */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 text-gray-800 dark:text-gray-200 shadow-xs transition-colors duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Link href="/" className="hover:underline">Home</Link> &rarr; <span>Search Library</span>
            </div>
            <h1 className="text-xl font-bold text-brand-trunk dark:text-brand-light">
              Explore Verified Works
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
              Search by file name or document title inside cloud drive links. All works are mirrored via view-only cloud drives.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setShowUploadModal(true);
                } else {
                  setShowGuestGateModal(true);
                }
              }}
              className="px-3.5 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              + Contribute Link
            </button>
            <button
              onClick={() => setShowAssistedModal(true)}
              className="px-3 py-1.5 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg transition"
            >
              Assisted Intake
            </button>
          </div>
        </div>

        {/* Notice & Safeguard Indicators */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 dark:text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-gray-200">Notice:</span>
            <span>
              For disclaimers please visit:{" "}
              <Link
                href="/disclaimers"
                className="text-brand-trunk dark:text-brand-light underline font-medium hover:opacity-80"
              >
                /disclaimers
              </Link>
            </span>
          </div>

          <div className="text-[11px] flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span>🔒 Zero-Download</span>
            <span>•</span>
            <span>🛡️ View-Only Safeguards</span>
            <span>•</span>
            <span>⚡ Instant Search</span>
          </div>
        </div>
      </div>

      {/* Interactive Search Section */}
      <SearchSection onSearch={handleSearch} loading={loading} />

      {/* Results Feed Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-1 gap-2">
          <span>
            {loading ? (
              "Searching library in Supabase..."
            ) : (
              <>
                Showing <strong>{works.length}</strong> of <strong>{pagination.total}</strong> verified works
              </>
            )}
          </span>

          <div className="flex items-center gap-4">
            {/* Page Size Selector (5 - 15) */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="pageSizeSelect" className="text-gray-600 dark:text-gray-400">
                Show:
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-0.5 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-800 dark:text-gray-200 text-xs font-semibold focus:outline-hidden"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
              <span>per page</span>
            </div>

            {pagination.totalPages > 1 && (
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : works.length === 0 && !error ? (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-10 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="text-3xl">📚</div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Verified Works Found</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              No verified works currently match your filter criteria in the database. When new Google Drive or OneDrive links are submitted and verified by administrators, they will appear here automatically.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                Submit a View-Only Work
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {works.map((work) => (
              <DisplayCard
                key={work.work_id}
                work={work}
                onRevealDrive={(id) => setRevealWorkId(id)}
                onReportTakedown={(id, title) => setTakedownWork({ id, title })}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition"
            >
              &larr; Previous Page
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400 px-2 font-mono">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition"
            >
              Next Page &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <MaskedDriveRevealModal
        isOpen={Boolean(revealWorkId)}
        workId={revealWorkId}
        onClose={() => setRevealWorkId(null)}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => fetchWorks(currentFilters, 1, pageSize)}
      />

      <ContributorAuthGateModal
        isOpen={showGuestGateModal}
        onClose={() => setShowGuestGateModal(false)}
      />

      <AssistedIntakeModal
        isOpen={showAssistedModal}
        onClose={() => setShowAssistedModal(false)}
        onSuccess={() => fetchWorks(currentFilters, 1, pageSize)}
      />

      <TakedownModal
        isOpen={Boolean(takedownWork)}
        workId={takedownWork?.id}
        workTitle={takedownWork?.title}
        onClose={() => setTakedownWork(null)}
        onSuccess={() => fetchWorks(currentFilters, pagination.page, pageSize)}
      />
    </div>
  );
}
