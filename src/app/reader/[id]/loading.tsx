"use client";

import React from "react";

export default function ReaderLoading() {
  return (
    <div className="min-h-screen bg-[#f6f6f4] -mx-4 -my-4 p-4 text-[#1a1a1a] transition-colors duration-150">
      {/* Sticky Reader Toolbar Skeleton */}
      <header className="sticky top-0 z-40 border-b border-[#e5e5e0] bg-[#ededeb] py-2.5 px-4 backdrop-blur-md shadow-xs animate-pulse">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-300 rounded w-24" />
            <div className="h-4 bg-gray-300 rounded w-40 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-300 rounded w-20" />
            <div className="h-6 bg-gray-300 rounded w-16" />
            <div className="h-6 bg-gray-300 rounded w-16" />
          </div>
        </div>
      </header>

      {/* Main Reader View Skeleton */}
      <main className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-pulse">
        {/* Work Metadata Header Box */}
        <div className="p-6 rounded-lg border border-[#e5e5e0] bg-white space-y-3">
          <div className="h-7 bg-gray-300 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="flex gap-2 pt-2">
            <div className="h-5 bg-gray-200 rounded-full w-20" />
            <div className="h-5 bg-gray-200 rounded-full w-24" />
            <div className="h-5 bg-gray-200 rounded-full w-16" />
          </div>
          <div className="h-14 bg-gray-100 rounded w-full pt-2" />
        </div>

        {/* Reading Content Paragraphs */}
        <div className="space-y-4 pt-4">
          <div className="h-4 bg-gray-300/60 rounded w-full" />
          <div className="h-4 bg-gray-300/60 rounded w-11/12" />
          <div className="h-4 bg-gray-300/60 rounded w-full" />
          <div className="h-4 bg-gray-300/60 rounded w-4/5" />
          <div className="h-10" />
          <div className="h-4 bg-gray-300/60 rounded w-full" />
          <div className="h-4 bg-gray-300/60 rounded w-10/12" />
          <div className="h-4 bg-gray-300/60 rounded w-full" />
        </div>
      </main>
    </div>
  );
}
