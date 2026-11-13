"use client";

import React, { useState } from "react";

export interface SearchFilters {
  q: string;
  fandom?: string;
  rating?: string;
  tag?: string;
  contentFilter?: "all" | "sfw" | "nsfw";
}

interface SearchSectionProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [q, setQ] = useState("");
  const [contentFilter, setContentFilter] = useState<"all" | "sfw" | "nsfw">("all");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ q: q.trim(), fandom: "", rating: "All", tag: "", contentFilter });
  }

  function handleFilterChange(filter: "all" | "sfw" | "nsfw") {
    setContentFilter(filter);
    onSearch({ q: q.trim(), fandom: "", rating: "All", tag: "", contentFilter: filter });
  }

  function handleReset() {
    setQ("");
    setContentFilter("all");
    onSearch({ q: "", fandom: "", rating: "All", tag: "", contentFilter: "all" });
  }

  return (
    <div id="search" className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 sm:p-5 shadow-xs space-y-2 transition-colors duration-150">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by file name or fic title inside drive links..."
              className="w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-brand-trunk focus:border-brand-trunk outline-hidden text-xs sm:text-sm bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder-gray-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-trunk hover:bg-brand-bark text-white font-semibold text-xs sm:text-sm rounded-lg transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? "Searching..." : "Search Files"}
            </button>

            {q.trim() && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300 text-xs sm:text-sm rounded-lg transition"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* SFW / NSFW Content Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-light dark:border-border-dark text-xs">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
              contentFilter === "all"
                ? "bg-brand-trunk text-white shadow-2xs font-semibold"
                : "bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 border border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
            }`}
          >
            All Works
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("sfw")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              contentFilter === "sfw"
                ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                : "bg-canvas-light dark:bg-canvas-dark text-emerald-700 dark:text-emerald-400 border border-border-light dark:border-border-dark hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
          >
            <span>🟢</span>
            <span>SFW Only</span>
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("nsfw")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              contentFilter === "nsfw"
                ? "bg-red-600 text-white shadow-2xs font-semibold"
                : "bg-canvas-light dark:bg-canvas-dark text-red-600 dark:text-red-400 border border-border-light dark:border-border-dark hover:bg-red-50 dark:hover:bg-red-950/30"
            }`}
          >
            <span>🔴</span>
            <span>NSFW (18+)</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-1">
          Instant search across indexed Google Drive and OneDrive document file names.
        </p>
      </form>
    </div>
  );
}
