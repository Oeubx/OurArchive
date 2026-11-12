"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function EmergencyNoticeBanner() {
  const [dismissed, setDismissed] = useState(true); // default true to prevent SSR hydration flash

  useEffect(() => {
    const isDismissed = localStorage.getItem("ourarchive_notice_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("ourarchive_notice_dismissed", "true");
  }

  if (dismissed) {
    return (
      <div className="bg-amber-100/70 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100 px-4 py-1.5 text-[11px]">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center flex-wrap justify-between gap-2">
          <span>
            <strong>Emergency Temporary Service:</strong> Respecting creator sovereignty under zero-download guidelines.
          </span>
          <div className="flex items-center gap-3 font-medium">
            <Link href="/disclaimers" className="hover:underline">
              Governance Charter
            </Link>
            <span>•</span>
            <Link href="/takedown" className="hover:underline text-brand-trunk dark:text-brand-light font-semibold">
              Immediate Takedown
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/35 border-b-2 border-amber-300 dark:border-amber-900/60 text-amber-950 dark:text-amber-100 px-4 py-2.5 text-xs shadow-xs transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span className="font-bold tracking-tight text-amber-900 dark:text-amber-200 uppercase text-[11px]">
              Emergency Community Notice & Platform Scope
            </span>
          </div>
          <p className="text-amber-900/90 dark:text-amber-100/85 leading-relaxed text-[11px]">
            <strong>OurArchive</strong> is a temporary emergency reading aid during service disruptions. It operates under strict zero-download, read-only principles with author-sovereign takedowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          <Link
            href="/disclaimers"
            className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900/70 hover:bg-amber-300 dark:hover:bg-amber-800/80 text-amber-950 dark:text-amber-100 rounded font-medium transition"
          >
            Read Disclaimers
          </Link>
          <Link
            href="/takedown"
            className="px-2.5 py-1 bg-brand-trunk hover:bg-brand-bark text-white rounded font-medium transition"
          >
            Takedown Policy
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-800 dark:text-amber-200 hover:text-amber-950 dark:hover:text-white rounded transition font-bold"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
