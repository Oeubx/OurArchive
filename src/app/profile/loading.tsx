"use client";

import React from "react";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark animate-pulse">
        <div className="space-y-1.5">
          <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-44" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-64" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
      </div>

      {/* Main Profile Identity Card Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs space-y-6 animate-pulse">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-border-light dark:border-border-dark">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
              <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Display Name Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-36" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-64" />
          </div>
          <div className="h-10 bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg w-full max-w-md" />
          <div className="h-9 bg-gray-300 dark:bg-zinc-700 rounded-lg w-32" />
        </div>
      </div>

      {/* Bookmarks Card Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-32" />
        </div>
        <div className="p-8 text-center space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-10 mx-auto" />
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-40 mx-auto" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
