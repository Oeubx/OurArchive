"use client";

import React from "react";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function SearchLoading() {
  return (
    <div className="space-y-6 py-2">
      {/* Search Header Banner Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-xs animate-pulse space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-28" />
        <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 shadow-xs animate-pulse flex flex-col sm:flex-row gap-3">
        <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-lg flex-1" />
        <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-lg w-32" />
        <div className="h-9 bg-gray-200 dark:bg-zinc-800 rounded-lg w-28" />
      </div>

      {/* Results Header Skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-36" />
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-28" />
      </div>

      {/* 5 Card Skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
