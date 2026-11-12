"use client";

import React from "react";

export function SkeletonTableRow() {
  return (
    <tr
      role="status"
      aria-label="Loading table record..."
      className="animate-pulse border-b border-border-light dark:border-border-dark"
    >
      {/* Title & Author / Fandom */}
      <td className="py-3.5 px-4 space-y-1.5">
        <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-32" />
        <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
      </td>

      {/* Masked Link */}
      <td className="py-3.5 px-4">
        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-36" />
      </td>

      {/* Submitter / Date */}
      <td className="py-3.5 px-4 space-y-1">
        <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-20" />
        <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded w-14" />
      </td>

      {/* Status Pill */}
      <td className="py-3.5 px-4">
        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded-full w-24" />
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-12" />
          <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-12" />
          <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-12" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonMobileCard() {
  return (
    <div
      role="status"
      aria-label="Loading item card..."
      className="p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs space-y-3 animate-pulse"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-gray-300 dark:bg-zinc-700 rounded w-2/3" />
          <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
        </div>
        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded-full w-16" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
      <div className="flex items-center gap-1.5 pt-1">
        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-14" />
        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-14" />
        <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-14" />
      </div>
    </div>
  );
}
