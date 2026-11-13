"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading fanwork item..."
      className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md shadow-xs overflow-hidden animate-pulse transition-colors duration-150"
    >
      {/* CARD CONTENT */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Title and Author */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-2/5" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
        </div>

        {/* Metadata Chips (Fandom, Pairing, Rating, Word Count) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded-full w-20" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded-full w-24" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded-full w-16" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded-full w-14" />
        </div>

        {/* Summary text lines */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-5/6" />
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 flex items-center justify-between border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <div className="h-7 bg-brand-trunk/30 dark:bg-brand-trunk/20 rounded-md w-28" />
            <div className="h-7 bg-gray-200 dark:bg-zinc-800 rounded-md w-24" />
          </div>
          <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
