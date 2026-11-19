"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DriveLink } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { maskWorkId } from "@/lib/utils/idMasker";

interface ContributorTableProps {
  contributions: DriveLink[];
  onUploadClick: () => void;
  onRefresh?: () => void;
}

export function ContributorTable({
  contributions,
  onUploadClick,
  onRefresh,
}: ContributorTableProps) {
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "personal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "under_verification" | "rejected" | "flagged">("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "folder" | "file">("all");

  // Pagination states (configurable: 5, 10, 15)
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Visibility toggle confirmation state
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<{
    linkId: string;
    title: string;
    targetHidden: boolean;
  } | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const statusStyles: Record<string, { label: string; class: string }> = {
    under_verification: {
      label: "🟡 Under Verification",
      class: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    },
    approved: {
      label: "🟢 Approved",
      class: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800",
    },
    hidden: {
      label: "🔒 Personal Archive",
      class: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700",
    },
    rejected: {
      label: "🔴 Rejected",
      class: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800",
    },
    flagged: {
      label: "⚠️ Quarantined",
      class: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    },
  };

  // Filter contributions
  const filteredContributions = useMemo(() => {
    return contributions.filter((item) => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAuthor = item.authorName.toLowerCase().includes(q);
        const matchesFandom = item.fandom.toLowerCase().includes(q);
        const matchesSummary = (item.summary || "").toLowerCase().includes(q);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesFandom && !matchesSummary && !matchesTags) {
          return false;
        }
      }

      // 2. Visibility Filter
      const isPersonal = item.status === "hidden";
      if (visibilityFilter === "public" && isPersonal) return false;
      if (visibilityFilter === "personal" && !isPersonal) return false;

      // 3. Status Filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // 4. Format Filter
      const isFolder =
        item.mimeType.includes("folder") ||
        item.rawDriveUrl.includes("/folders/");
      if (formatFilter === "folder" && !isFolder) return false;
      if (formatFilter === "file" && isFolder) return false;

      return true;
    });
  }, [contributions, searchQuery, visibilityFilter, statusFilter, formatFilter]);

  // Pagination calculation
  const totalItems = filteredContributions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const displayedItems = filteredContributions.slice(startIndex, startIndex + pageSize);

  async function handleConfirmVisibility() {
    if (!pendingVisibilityChange) return;
    setIsUpdatingVisibility(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/contribute/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId: pendingVisibilityChange.linkId,
          isHidden: pendingVisibilityChange.targetHidden,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update visibility.");
      }

      setActionFeedback({
        type: "success",
        message: data.message || "Visibility updated successfully.",
      });
      setPendingVisibilityChange(null);
      onRefresh?.();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update visibility.",
      });
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden transition-colors duration-150 space-y-0">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📚 Personal Fanwork Archive</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-subtle-light dark:bg-subtle-dark font-mono text-gray-600 dark:text-gray-400">
              {contributions.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Your personal collection of view-only fanwork links. Read your works anytime or toggle sharing with the community archive.
          </p>
        </div>

        <button
          onClick={onUploadClick}
          className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>➕</span>
          <span>Upload / Add Work</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`mx-4 mt-3 p-3 text-xs rounded-lg border flex items-center justify-between ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold hover:opacity-70 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search-Grade Filter Toolbar */}
      {contributions.length > 0 && (
        <div className="p-4 bg-canvas-light/60 dark:bg-canvas-dark/60 border-b border-border-light dark:border-border-dark space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Live Search Input */}
            <div className="relative grow">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, author, fandom, or tags in your archive..."
                className="w-full pl-8 pr-3 py-1.5 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 text-xs outline-hidden focus:ring-1 focus:ring-brand-trunk"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Configurable Page Size Selector (5, 10, 15) */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs text-gray-600 dark:text-gray-400">
              <span className="text-[11px] font-semibold">Rows:</span>
              <div className="inline-flex rounded-lg border border-border-light dark:border-border-dark overflow-hidden bg-surface-light dark:bg-surface-dark">
                {[5, 10, 15].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold transition ${
                      pageSize === size
                        ? "bg-brand-trunk text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Visibility Pills */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 font-medium">Visibility:</span>
              <button
                type="button"
                onClick={() => {
                  setVisibilityFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] transition ${
                  visibilityFilter === "all"
                    ? "bg-brand-trunk text-white font-semibold"
                    : "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setVisibilityFilter("public");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] transition flex items-center gap-1 ${
                  visibilityFilter === "public"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light"
                }`}
              >
                <span>🌐</span> Public
              </button>
              <button
                type="button"
                onClick={() => {
                  setVisibilityFilter("personal");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] transition flex items-center gap-1 ${
                  visibilityFilter === "personal"
                    ? "bg-gray-700 text-white font-semibold"
                    : "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light"
                }`}
              >
                <span>🔒</span> Personal Archive
              </button>
            </div>

            {/* Format Pills */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-gray-400 font-medium">Format:</span>
              <button
                type="button"
                onClick={() => {
                  setFormatFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  formatFilter === "all" ? "font-bold text-brand-trunk" : "text-gray-500 hover:underline"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormatFilter("folder");
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  formatFilter === "folder" ? "font-bold text-amber-600" : "text-gray-500 hover:underline"
                }`}
              >
                📁 Folders
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormatFilter("file");
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  formatFilter === "file" ? "font-bold text-blue-600" : "text-gray-500 hover:underline"
                }`}
              >
                📄 Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Content */}
      {contributions.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <div className="text-3xl">📭</div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            No Fanworks in Your Personal Archive
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You haven&apos;t added any works yet. Upload your Google Drive view-only links to build your personal reading archive.
          </p>
          <div className="pt-2">
            <button
              onClick={onUploadClick}
              className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              + Submit Your First Link
            </button>
          </div>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <span>No fanworks match your search criteria.</span>
          <div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setVisibilityFilter("all");
                setStatusFilter("all");
                setFormatFilter("all");
              }}
              className="text-xs text-brand-trunk font-semibold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle-light/70 dark:bg-subtle-dark/70 border-b border-border-light dark:border-border-dark text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Work Title &amp; Details</th>
                <th className="py-3 px-4">Visibility &amp; Sharing</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {displayedItems.map((link) => {
                const statusInfo = statusStyles[link.status] || {
                  label: link.status,
                  class: "bg-gray-100 text-gray-700",
                };

                const isPersonal = link.status === "hidden";
                const isFolder =
                  link.mimeType.includes("folder") ||
                  link.rawDriveUrl.includes("/folders/");

                return (
                  <tr
                    key={link.id}
                    className="hover:bg-subtle-light/50 dark:hover:bg-subtle-dark/50 transition-colors"
                  >
                    {/* Title & Fandom */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
                        <span>{isFolder ? "📁" : "📄"}</span>
                        <span>{link.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5 flex-wrap">
                        <span>{link.fandom}</span>
                        <span>•</span>
                        <span>{link.rating}</span>
                        {link.wordCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{link.wordCount.toLocaleString()} words</span>
                          </>
                        )}
                        {link.pairing && (
                          <>
                            <span>•</span>
                            <span className="italic">{link.pairing}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Visibility & Toggle Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isPersonal
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {isPersonal ? "🔒 Personal Archive" : "🌐 Public Archive"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingVisibilityChange({
                              linkId: link.id,
                              title: link.title,
                              targetHidden: !isPersonal,
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-medium border border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark transition text-gray-600 dark:text-gray-300 cursor-pointer"
                          title={isPersonal ? "Make this work public to community search" : "Archive this work to your private vault"}
                        >
                          {isPersonal ? "Make Public 🌐" : "Make Private 🔒"}
                        </button>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-[11px]">
                      {formatTimeAgo(link.uploadedAt)}
                    </td>

                    {/* Actions: Always allow contributor to read their own works */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/reader/${maskWorkId(link.id)}`}
                        className="px-3 py-1 bg-brand-trunk hover:bg-brand-bark text-white text-[11px] font-semibold rounded-lg shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                        title="Stream distraction-free in Reader mode"
                      >
                        <span>👁️</span> Read
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="p-3.5 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-canvas-light/40 dark:bg-canvas-dark/40">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            Showing <strong className="text-gray-800 dark:text-gray-200">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{" "}
            <strong className="text-gray-800 dark:text-gray-200">{Math.min(startIndex + pageSize, totalItems)}</strong> of{" "}
            <strong className="text-gray-800 dark:text-gray-200">{totalItems}</strong> fanworks
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-border-light dark:border-border-dark rounded-md bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer"
            >
              &larr; Previous
            </button>
            <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 px-1">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-border-light dark:border-border-dark rounded-md bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Visibility Toggle */}
      {pendingVisibilityChange && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-surface-light dark:bg-surface-dark border-2 border-brand-trunk/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{pendingVisibilityChange.targetHidden ? "🔒" : "🌐"}</span>
              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                {pendingVisibilityChange.targetHidden
                  ? "Archive to Personal Vault (Make Private)?"
                  : "Share with Public Library (Make Public)?"}
              </h4>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Target fanwork: <strong>&ldquo;{pendingVisibilityChange.title}&rdquo;</strong>
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {pendingVisibilityChange.targetHidden
                ? "This work will be stored in your Personal Archive. It will be hidden from public library search and cannot be read by other users. You can still stream and read it anytime."
                : "This work will be marked Public. Once verified by community moderators, it will be discoverable and readable by all visitors in search and library feeds."}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setPendingVisibilityChange(null)}
                disabled={isUpdatingVisibility}
                className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVisibility}
                disabled={isUpdatingVisibility}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  pendingVisibilityChange.targetHidden
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {isUpdatingVisibility && <span className="animate-spin text-xs">⏳</span>}
                <span>
                  {pendingVisibilityChange.targetHidden ? "Yes, Make Private" : "Yes, Make Public"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
