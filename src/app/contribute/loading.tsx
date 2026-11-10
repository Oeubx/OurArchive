"use client";

import React from "react";
import { SkeletonTableRow } from "@/components/ui/SkeletonTableRow";

export default function ContributeLoading() {
  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-150">
      {/* Top Breadcrumb & User Identity Skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-40" />
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-32" />
      </div>

      {/* Contributions Table Card Skeleton */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-5 bg-gray-300 dark:bg-zinc-700 rounded w-36" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-52" />
          </div>
          <div className="h-8 bg-brand-trunk/30 dark:bg-brand-trunk/20 rounded-lg w-36" />
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-subtle-light/70 dark:bg-subtle-dark/70 border-b border-border-light dark:border-border-dark text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Work Title & Fandom</th>
                <th className="py-3 px-4">Google Drive Link (Masked)</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <SkeletonTableRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
