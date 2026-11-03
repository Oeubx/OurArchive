"use client";

import React from "react";
import Link from "next/link";
import { DriveLink } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";

interface ContributorTableProps {
  contributions: DriveLink[];
  onUploadClick: () => void;
}

export function ContributorTable({
  contributions,
  onUploadClick,
}: ContributorTableProps) {
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
      label: "⚪ Hidden",
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

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden transition-colors duration-150">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📚 My Contributions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-subtle-light dark:bg-subtle-dark font-mono text-gray-600 dark:text-gray-400">
              {contributions.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View-only Google Drive links submitted under your account
          </p>
        </div>

        <button
          onClick={onUploadClick}
          className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>➕</span>
          <span>Upload New Drive Link</span>
        </button>
      </div>

      {/* Table Content */}
      {contributions.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <div className="text-3xl">📭</div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            No Contributions Yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You haven&apos;t uploaded any fanworks yet. Click the button below to share an author-approved view-only Drive link.
          </p>
          <div className="pt-2">
            <button
              onClick={onUploadClick}
              className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              + Submit Your First Link
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle-light/70 dark:bg-subtle-dark/70 border-b border-border-light dark:border-border-dark text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Work Title & Fandom</th>
                <th className="py-3 px-4">Google Drive Link (Masked)</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {contributions.map((link) => {
                const statusInfo = statusStyles[link.status] || {
                  label: link.status,
                  class: "bg-gray-100 text-gray-700",
                };

                return (
                  <tr
                    key={link.id}
                    className="hover:bg-subtle-light/50 dark:hover:bg-subtle-dark/50 transition-colors"
                  >
                    {/* Title & Fandom */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                        {link.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                        <span>{link.fandom}</span>
                        <span>•</span>
                        <span>{link.rating}</span>
                        {link.wordCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{link.wordCount.toLocaleString()} words</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Masked Drive Link */}
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                      <span
                        className="px-2 py-1 rounded bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark select-all"
                        title={link.maskedDriveUrl}
                      >
                        {link.maskedDriveUrl}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-[11px]">
                      {formatTimeAgo(link.uploadedAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {link.status === "approved" ? (
                        <Link
                          href={`/reader/${link.id}`}
                          className="px-2.5 py-1 bg-ao3-red hover:bg-ao3-darkred text-white text-[11px] font-semibold rounded shadow-2xs transition inline-flex items-center gap-1"
                        >
                          <span>👁️</span> Read
                        </Link>
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                          In Queue
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
