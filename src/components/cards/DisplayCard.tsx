"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { PublicSearchFeedRecord } from "@/types/database";

interface DisplayCardProps {
  work: PublicSearchFeedRecord;
  onRevealDrive?: (workId: string) => void;
  onReportTakedown?: (workId: string, title: string) => void;
  isAdmin?: boolean;
  canReveal?: boolean;
}

export function DisplayCard({
  work,
  onRevealDrive,
  onReportTakedown,
  isAdmin = false,
  canReveal = false,
}: DisplayCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [hiddenLocally, setHiddenLocally] = useState(false);

  if (hiddenLocally) {
    return null;
  }

  const formattedDate = new Date(work.uploaded_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const ratingColors: Record<string, string> = {
    "General Audiences": "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800",
    "Teen And Up Audiences": "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800",
    Mature: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    Explicit: "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800",
    "Not Rated": "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700",
  };

  const badgeClass =
    work.verification_badge === "MANUAL_VERIFIED"
      ? "bg-green-700 text-white"
      : work.verification_badge === "AUTOMATED_PASS"
      ? "bg-emerald-600 text-white"
      : "bg-amber-600 text-white";

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md shadow-xs overflow-hidden transition hover:border-gray-400 dark:hover:border-gray-600">
      {/* SYSTEM HEADER */}
      <div className="bg-subtle-light dark:bg-subtle-dark border-b border-border-light dark:border-border-dark px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
        <span className="font-semibold tracking-wide text-gray-700 dark:text-gray-300">
          SYSTEM HEADER: OurArchive Emergency Mirror (Temporary Read-Only Library)
        </span>
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {work.mime_type.includes("pdf") ? "PDF Mirror" : "Doc Mirror"}
        </span>
      </div>

      {/* DISPLAYED FILE SECTION */}
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-brand-trunk dark:text-brand-light hover:underline">
              <Link href={`/reader/${work.work_id}`}>{work.title}</Link>
            </h3>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              by <strong className="text-gray-900 dark:text-gray-100">{work.author_name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                ratingColors[work.rating || "Not Rated"] || ratingColors["Not Rated"]
              }`}
            >
              {work.rating || "Not Rated"}
            </span>
          </div>
        </div>

        {/* Fandom & Pairing Bar */}
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Fandom:</span>
          <span className="bg-subtle-light dark:bg-subtle-dark px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{work.fandom}</span>
          {work.pairing && (
            <>
              <span className="text-gray-400">•</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">Pairing:</span>
              <span className="text-gray-700 dark:text-gray-300">{work.pairing}</span>
            </>
          )}
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">
            Words: <strong className="text-gray-700 dark:text-gray-300">{work.word_count.toLocaleString()}</strong>
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">Updated: {formattedDate}</span>
        </div>

        {/* Summary */}
        {work.summary && (
          <div className="bg-canvas-light dark:bg-canvas-dark border-l-2 border-brand-trunk p-2.5 rounded-r text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
            &ldquo;{work.summary}&rdquo;
          </div>
        )}

        {/* Tags */}
        {work.tags && work.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {work.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-subtle-light dark:bg-subtle-dark hover:bg-gray-200 dark:hover:bg-gray-700 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 rounded text-[11px] transition"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FILE DETAILS & CONTROLS ACCORDION / TOGGLE */}
      <div className="border-t border-border-light dark:border-border-dark bg-subtle-light/70 dark:bg-subtle-dark/70 px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition"
        >
          <span>{showDetails ? "▲" : "▼"}</span>
          <span>{showDetails ? "Hide Details & Diagnostics" : "File Details & Verification Diagnostics"}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* PRIMARY READING ACCESS */}
          <Link
            href={`/reader/${work.work_id}`}
            className="px-3 py-1 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded shadow-xs transition flex items-center gap-1"
          >
            <span>👁️</span> Read Work
          </Link>

          {/* REVEAL LINK: Restricted exclusively to Admins, Verifiers, and Authorized Uploaders */}
          {(canReveal || isAdmin) && onRevealDrive && (
            <button
              onClick={() => onRevealDrive(work.work_id)}
              className="px-3 py-1 bg-surface-light dark:bg-surface-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 text-xs font-medium rounded transition flex items-center gap-1"
              title="Inspect verified Google Drive view-only URL"
            >
              <span>🔗</span> View Drive Link
            </button>
          )}

          {onReportTakedown && (
            <button
              onClick={() => onReportTakedown(work.work_id, work.title)}
              className="px-2.5 py-1 bg-surface-light dark:bg-surface-dark hover:bg-red-50 dark:hover:bg-red-950/30 border border-border-light dark:border-border-dark text-gray-500 hover:text-red-700 dark:hover:text-red-400 text-xs rounded transition flex items-center gap-1"
              title="Report issue or request immediate removal"
            >
              <span>🚨</span> Takedown
            </button>
          )}
        </div>
      </div>

      {/* EXPANDABLE DETAILS */}
      {showDetails && (
        <div className="border-t border-dashed border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark p-4 text-[11px] text-gray-700 dark:text-gray-300 space-y-2 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">• Drive Owner:</span>{" "}
              <strong className="text-gray-800 dark:text-gray-200">{work.display_drive_owner || "Anonymous Owner"}</strong>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">• Upload Mode:</span>{" "}
              <span className="capitalize">{work.upload_mode.replace("_", " ")}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">• Safety Score:</span>{" "}
              <span className="text-green-700 dark:text-green-400 font-semibold">{work.automated_risk_score}/100 (Clean)</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">• Verification Status:</span>{" "}
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${badgeClass}`}>
                {work.verification_badge}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2">
              <button
                disabled={isHiding}
                onClick={async () => {
                  if (confirm("Hide this fanwork from the public search index?")) {
                    setIsHiding(true);
                    try {
                      const res = await fetch("/api/admin/actions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          linkId: work.work_id,
                          actionType: "HIDE",
                          reason: "Admin quick-hide from search card",
                        }),
                      });
                      if (res.ok) {
                        setHiddenLocally(true);
                      }
                    } catch {
                      // Fallback
                    } finally {
                      setIsHiding(false);
                    }
                  }
                }}
                className="px-2 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 hover:bg-red-200 border border-red-300 dark:border-red-800 rounded text-[10px] font-sans transition disabled:opacity-50"
              >
                {isHiding ? "Hiding..." : "🚫 Hide This File (Admin)"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
