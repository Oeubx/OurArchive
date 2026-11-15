"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AdultContentAdvisoryModal } from "./AdultContentAdvisoryModal";

export interface SearchFilters {
  q: string;
  fandom?: string;
  rating?: string;
  tag?: string;
  category?: string;
  warning?: string;
  character?: string;
  relationship?: string;
  isComplete?: "all" | "true" | "false";
  minWords?: number | "";
  maxWords?: number | "";
  contentFilter?: "all" | "sfw" | "nsfw";
}

interface SearchSectionProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

const CATEGORIES = ["All", "F/F", "M/M", "F/M", "Gen", "Multi", "Other"];
const RATINGS = [
  "All",
  "General Audiences",
  "Teen And Up Audiences",
  "Mature",
  "Explicit",
  "Not Rated",
];
const WARNINGS = [
  "All",
  "No Archive Warnings Apply",
  "Creator Chose Not To Use Archive Warnings",
  "Graphic Depictions Of Violence",
  "Major Character Death",
  "Rape/Non-Con",
  "Underage",
];

export function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [q, setQ] = useState("");
  const [contentFilter, setContentFilter] = useState<"all" | "sfw" | "nsfw">("all");
  const [category, setCategory] = useState("All");
  const [rating, setRating] = useState("All");
  const [warning, setWarning] = useState("All");
  const [isComplete, setIsComplete] = useState<"all" | "true" | "false">("all");
  const [character, setCharacter] = useState("");
  const [relationship, setRelationship] = useState("");
  const [fandom, setFandom] = useState("");
  const [tag, setTag] = useState("");
  const [minWords, setMinWords] = useState<number | "">("");
  const [maxWords, setMaxWords] = useState<number | "">("");

  const [expanded, setExpanded] = useState(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const buildCurrentFilters = useCallback((): SearchFilters => {
    return {
      q: q.trim(),
      fandom: fandom.trim(),
      rating,
      tag: tag.trim(),
      category: category !== "All" ? category : undefined,
      warning: warning !== "All" ? warning : undefined,
      character: character.trim() || undefined,
      relationship: relationship.trim() || undefined,
      isComplete: isComplete !== "all" ? isComplete : undefined,
      minWords: minWords !== "" ? minWords : undefined,
      maxWords: maxWords !== "" ? maxWords : undefined,
      contentFilter,
    };
  }, [
    q,
    fandom,
    rating,
    tag,
    category,
    warning,
    character,
    relationship,
    isComplete,
    minWords,
    maxWords,
    contentFilter,
  ]);

  // Debounced auto-search for text inputs (350ms delay)
  const triggerDebouncedSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onSearch(buildCurrentFilters());
    }, 350);
  }, [onSearch, buildCurrentFilters]);

  // Trigger immediate search for pill clicks and select changes
  const triggerImmediateSearch = useCallback(
    (overrides?: Partial<SearchFilters>) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const current = buildCurrentFilters();
      onSearch({ ...current, ...overrides });
    },
    [onSearch, buildCurrentFilters]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  function handleQueryChange(val: string) {
    setQ(val);
    triggerDebouncedSearch();
  }

  function handleCharacterChange(val: string) {
    setCharacter(val);
    triggerDebouncedSearch();
  }

  function handleRelationshipChange(val: string) {
    setRelationship(val);
    triggerDebouncedSearch();
  }

  function handleFandomChange(val: string) {
    setFandom(val);
    triggerDebouncedSearch();
  }

  function handleTagChange(val: string) {
    setTag(val);
    triggerDebouncedSearch();
  }

  function handleMinWordsChange(val: string) {
    const num = val === "" ? "" : Math.max(0, parseInt(val, 10));
    setMinWords(num);
    triggerDebouncedSearch();
  }

  function handleMaxWordsChange(val: string) {
    const num = val === "" ? "" : Math.max(0, parseInt(val, 10));
    setMaxWords(num);
    triggerDebouncedSearch();
  }

  function handleCategoryClick(cat: string) {
    setCategory(cat);
    triggerImmediateSearch({ category: cat !== "All" ? cat : undefined });
  }

  function handleRatingClick(r: string) {
    setRating(r);
    triggerImmediateSearch({ rating: r });
  }

  function handleWarningClick(w: string) {
    setWarning(w);
    triggerImmediateSearch({ warning: w !== "All" ? w : undefined });
  }

  function handleStatusClick(status: "all" | "true" | "false") {
    setIsComplete(status);
    triggerImmediateSearch({ isComplete: status !== "all" ? status : undefined });
  }

  function handleContentFilterChange(filter: "all" | "sfw" | "nsfw") {
    if (filter === "nsfw") {
      const hasConsent =
        typeof window !== "undefined" &&
        localStorage.getItem("ourarchive_nsfw_consent") === "true";

      if (!hasConsent) {
        setShowAdvisoryModal(true);
        return;
      }
    }

    setContentFilter(filter);
    triggerImmediateSearch({ contentFilter: filter });
  }

  function handleConfirmAdultContent() {
    if (typeof window !== "undefined") {
      localStorage.setItem("ourarchive_nsfw_consent", "true");
    }
    setShowAdvisoryModal(false);
    setContentFilter("nsfw");
    triggerImmediateSearch({ contentFilter: "nsfw" });
  }

  function handleReset() {
    setQ("");
    setFandom("");
    setRating("All");
    setTag("");
    setCategory("All");
    setWarning("All");
    setCharacter("");
    setRelationship("");
    setIsComplete("all");
    setMinWords("");
    setMaxWords("");
    setContentFilter("all");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    onSearch({
      q: "",
      fandom: "",
      rating: "All",
      tag: "",
      contentFilter: "all",
    });
  }

  // Calculate active filter count
  const activeCount =
    (category !== "All" ? 1 : 0) +
    (rating !== "All" ? 1 : 0) +
    (warning !== "All" ? 1 : 0) +
    (isComplete !== "all" ? 1 : 0) +
    (character ? 1 : 0) +
    (relationship ? 1 : 0) +
    (fandom ? 1 : 0) +
    (tag ? 1 : 0) +
    (minWords !== "" || maxWords !== "" ? 1 : 0) +
    (contentFilter !== "all" ? 1 : 0);

  return (
    <div
      id="search"
      className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors duration-150"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          onSearch(buildCurrentFilters());
        }}
        className="space-y-3"
      >
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by title, author, fandom, character, or keyword (auto-searches)..."
              className="w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-brand-trunk focus:border-brand-trunk outline-hidden text-xs sm:text-sm bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder-gray-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-trunk hover:bg-brand-bark text-white font-semibold text-xs sm:text-sm rounded-lg transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-xs">⏳</span>
                  <span>Searching...</span>
                </>
              ) : (
                "Search Files"
              )}
            </button>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                expanded || activeCount > 0
                  ? "bg-brand-trunk/10 dark:bg-brand-trunk/20 border-brand-trunk text-brand-trunk dark:text-brand-light"
                  : "bg-canvas-light dark:bg-canvas-dark border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark"
              }`}
            >
              <span>{expanded ? "▲" : "▼"}</span>
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-brand-trunk text-white rounded-full text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
            </button>

            {(q.trim() || activeCount > 0) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300 text-xs sm:text-sm rounded-lg transition"
                title="Reset all filters"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Quick Content Classification Pills (SFW / NSFW) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-light dark:border-border-dark text-xs">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
            Safety Filter:
          </span>
          <button
            type="button"
            onClick={() => handleContentFilterChange("all")}
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
            onClick={() => handleContentFilterChange("sfw")}
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
            onClick={() => handleContentFilterChange("nsfw")}
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

        {/* EXPANDABLE DYNAMIC FILTER DRAWER */}
        {expanded && (
          <div className="pt-3 border-t border-border-light dark:border-border-dark space-y-4 animate-in fade-in duration-150">
            {/* Category Filter Pills */}
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                      category === cat
                        ? "bg-brand-trunk text-white border-brand-trunk shadow-2xs"
                        : "bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ratings Filter Pills */}
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Content Rating
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRatingClick(r)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                      rating === r
                        ? "bg-brand-trunk text-white border-brand-trunk shadow-2xs"
                        : "bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Archive Warnings Filter Pills */}
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Archive Warnings
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WARNINGS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleWarningClick(w)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                      warning === w
                        ? "bg-amber-700 text-white border-amber-700 shadow-2xs"
                        : "bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Completion Status Pills */}
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Completion Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Works" },
                  { id: "true", label: "Complete Works Only" },
                  { id: "false", label: "In Progress" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusClick(st.id as "all" | "true" | "false")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                      isComplete === st.id
                        ? "bg-brand-trunk text-white border-brand-trunk shadow-2xs"
                        : "bg-canvas-light dark:bg-canvas-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:border-gray-400"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Input Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Character Name
                </label>
                <input
                  type="text"
                  value={character}
                  onChange={(e) => handleCharacterChange(e.target.value)}
                  placeholder="e.g. Sullyoon"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Relationship / Pairing
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => handleRelationshipChange(e.target.value)}
                  placeholder="e.g. Bae/Sullyoon"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Fandom
                </label>
                <input
                  type="text"
                  value={fandom}
                  onChange={(e) => handleFandomChange(e.target.value)}
                  placeholder="e.g. NMIXX"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tag / Trope
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleTagChange(e.target.value)}
                  placeholder="e.g. College AU"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
                />
              </div>
            </div>

            {/* Word Count Range */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Word Count:
              </span>
              <input
                type="number"
                min="0"
                value={minWords}
                onChange={(e) => handleMinWordsChange(e.target.value)}
                placeholder="Min Words"
                className="w-24 px-2 py-1 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                min="0"
                value={maxWords}
                onChange={(e) => handleMaxWordsChange(e.target.value)}
                placeholder="Max Words"
                className="w-24 px-2 py-1 text-xs rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
              />
            </div>
          </div>
        )}
      </form>

      {/* Adult Content (18+) Confirmation Gate Modal */}
      <AdultContentAdvisoryModal
        isOpen={showAdvisoryModal}
        onClose={() => setShowAdvisoryModal(false)}
        onConfirm={handleConfirmAdultContent}
      />
    </div>
  );
}
