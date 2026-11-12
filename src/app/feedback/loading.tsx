"use client";

import React from "react";

export default function FeedbackLoading() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-5 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 sm:p-6 shadow-xs space-y-4 animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-28" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-72 max-w-full" />
          </div>
          <div className="h-10 bg-gray-300 dark:bg-zinc-700 rounded-lg w-full sm:w-36" />
        </div>
      </div>

      {/* Feedback List Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden animate-pulse">
        <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-40" />
          <div className="flex items-center gap-1.5 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-7 bg-gray-200 dark:bg-zinc-800 rounded-lg w-14 shrink-0" />
            ))}
          </div>
        </div>

        <div className="divide-y divide-border-light dark:divide-border-dark">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:p-5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
                <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
