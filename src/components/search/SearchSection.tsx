"use client";

import React, { useState } from "react";

export interface SearchFilters {
  q: string;
  fandom: string;
  rating: string;
  tag: string;
}

interface SearchSectionProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export function SearchSection({ onSearch, loading }: SearchSectionProps) {
  const [q, setQ] = useState("");
  const [fandom, setFandom] = useState("");
  const [rating, setRating] = useState("All");
  const [tag, setTag] = useState("");

  const ratings = [
    "All",
    "General Audiences",
    "Teen And Up Audiences",
    "Mature",
    "Explicit",
    "Not Rated",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ q, fandom, rating, tag });
  }

  function handleReset() {
    setQ("");
    setFandom("");
    setRating("All");
    setTag("");
    onSearch({ q: "", fandom: "", rating: "All", tag: "" });
  }

  function handleRatingClick(newRating: string) {
    setRating(newRating);
    onSearch({ q, fandom, rating: newRating, tag });
  }

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 shadow-xs space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, author name, fandom, or summary keywords..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-ao3-red focus:border-ao3-red outline-hidden text-xs bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-ao3-red hover:bg-ao3-darkred text-white font-semibold text-xs rounded transition shadow-xs disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {(q || fandom || tag || rating !== "All") && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-600 text-xs rounded transition"
              title="Reset all search filters"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filters Row: Fandom, Tag, and Rating Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Filter by Fandom:
            </label>
            <input
              type="text"
              value={fandom}
              onChange={(e) => setFandom(e.target.value)}
              placeholder="e.g. Heartstopper, Arcane, Harry Potter"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-ao3-red outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Filter by Tag / Trope:
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Fluff, Slow Burn, Mutual Pining"
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-ao3-red outline-hidden"
            />
          </div>
        </div>

        {/* Rating Pills */}
        <div className="pt-1">
          <span className="block text-[11px] font-semibold text-gray-700 mb-1.5">
            Rating Category:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ratings.map((r) => {
              const active = rating === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRatingClick(r)}
                  className={`px-2.5 py-1 text-[11px] rounded transition border ${
                    active
                      ? "bg-ao3-red text-white border-ao3-red font-semibold shadow-xs"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
