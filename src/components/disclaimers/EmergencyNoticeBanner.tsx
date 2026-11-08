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
      <div className="bg-amber-100/70 border-b border-amber-200 text-amber-950 px-4 py-1 text-[11px] flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2">
          <span>
            <strong>Emergency Temporary Service:</strong> Respecting creator sovereignty under zero-download guidelines.
          </span>
          <div className="flex items-center gap-3 font-medium">
            <Link href="/disclaimers" className="hover:underline">
              Governance Charter
            </Link>
            <span>•</span>
            <Link href="/takedown" className="hover:underline text-brand-trunk font-semibold">
              Immediate Takedown
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 text-amber-950 px-4 py-2.5 text-xs shadow-xs transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span className="font-bold tracking-tight text-amber-900 uppercase text-[11px]">
              Emergency Community Notice & Platform Scope
            </span>
          </div>
          <p className="text-amber-900/90 leading-relaxed text-[11px]">
            <strong>OurArchive</strong> is a temporary emergency reading aid during service disruptions. It operates under strict zero-download, read-only principles with author-sovereign takedowns.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <Link
            href="/disclaimers"
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded font-medium transition"
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
            className="p-1 text-amber-800 hover:text-amber-950 rounded transition font-bold"
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
