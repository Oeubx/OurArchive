"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SearchSection } from "@/components/search/SearchSection";
import type { SearchFilters } from "@/components/search/SearchSection";
import { DisplayCard } from "@/components/cards/DisplayCard";
import { MaskedDriveRevealModal } from "@/components/modals/MaskedDriveRevealModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { AssistedIntakeModal } from "@/components/upload/AssistedIntakeModal";
import type { PublicSearchFeedRecord } from "@/types/database";

export default function HomePage() {
  const [works, setWorks] = useState<PublicSearchFeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealWorkId, setRevealWorkId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssistedModal, setShowAssistedModal] = useState(false);

  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    q: "",
    fandom: "",
    rating: "All",
    tag: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchWorks = useCallback(async (filters: SearchFilters, page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.fandom) params.set("fandom", filters.fandom);
      if (filters.rating && filters.rating !== "All") params.set("rating", filters.rating);
      if (filters.tag) params.set("tag", filters.tag);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load works.");
      }

      setWorks(json.works || []);
      setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error retrieving search results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks(currentFilters, 1);
  }, [fetchWorks, currentFilters]);

  function handleSearch(filters: SearchFilters) {
    setCurrentFilters(filters);
    fetchWorks(filters, 1);
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWorks(currentFilters, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="space-y-6 py-2">
      {/* Platform System Announcement Header */}
      <div className="bg-ao3-light border border-ao3-border rounded-lg p-5 text-gray-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-ao3-red">
              OurArchive Emergency Mirror
            </h1>
            <p className="text-xs text-gray-600">
              Temporary view-only index for the fanfiction community during Archive of Our Own service windows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-xs transition"
            >
              + Submit Fanwork
            </button>
            <button
              onClick={() => setShowAssistedModal(true)}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-medium rounded transition"
            >
              Assisted Intake
            </button>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <span>🔒 <strong>Zero-Download:</strong> Read directly on-site with zero local file persistence</span>
          <span>🛡️ <strong>View-Only:</strong> Protected by Google Drive permission safeguards</span>
          <span>⚡ <strong>Sub-50ms:</strong> Weighted full-text PostgreSQL indexing</span>
        </div>
      </div>

      {/* Interactive Search Section */}
      <SearchSection onSearch={handleSearch} loading={loading} />

      {/* Results Feed Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <span>
            {loading ? (
              "Searching library..."
            ) : (
              <>
                Showing <strong>{works.length}</strong> of <strong>{pagination.total}</strong> verified works
              </>
            )}
          </span>
          {pagination.totalPages > 1 && (
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && works.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-200 rounded-md p-6 animate-pulse space-y-3"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-12 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && works.length === 0 && !error && (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-4 max-w-lg mx-auto">
            <div className="text-3xl">📚</div>
            <h3 className="text-base font-bold text-gray-800">No Verified Works Found</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              No fanworks match your current search criteria. If you recently submitted a Google Drive link, it may be pending automated threat scanning or administrator review.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-xs transition"
              >
                Submit a View-Only Work
              </button>
              <button
                onClick={() => setShowAssistedModal(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium rounded transition"
              >
                Submit via Assisted Intake
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {works.map((work) => (
            <DisplayCard
              key={work.work_id}
              work={work}
              onRevealDrive={(id) => setRevealWorkId(id)}
            />
          ))}
        </div>

        {/* Keyset Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
            >
              &larr; Previous Page
            </button>
            <span className="text-xs text-gray-600 px-2 font-mono">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
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
        onSuccess={() => fetchWorks(currentFilters, 1)}
      />

      <AssistedIntakeModal
        isOpen={showAssistedModal}
        onClose={() => setShowAssistedModal(false)}
        onSuccess={() => fetchWorks(currentFilters, 1)}
      />
    </div>
  );
}
