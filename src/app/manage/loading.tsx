"use client";

import React from "react";
import { SkeletonTableRow, SkeletonMobileCard } from "@/components/ui/SkeletonTableRow";

export default function ManageLoading() {
  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-150">
      {/* Top Banner Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs animate-pulse space-y-3">
        <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-1/3" />
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-1/2" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs animate-pulse space-y-2"
          >
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
            <div className="h-6 bg-gray-300 dark:bg-zinc-700 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Triage Suite Container Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-48" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-64" />
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 bg-gray-200 dark:bg-zinc-800 rounded-lg w-16" />
            ))}
          </div>
        </div>

        {/* Mobile View (< md) */}
        <div className="md:hidden p-3 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonMobileCard key={i} />
          ))}
        </div>

        {/* Desktop Table (md:) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle-light/70 dark:bg-subtle-dark/70 border-b border-border-light dark:border-border-dark text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Work & Author</th>
                <th className="py-3 px-4">Masked Link</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonTableRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
