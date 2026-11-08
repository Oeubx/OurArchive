"use client";

import React, { useState } from "react";
import type { DriveLink } from "@/lib/types";
import { hideLink, unhideLink, removeLink } from "@/lib/rbacService";

interface AdminTakedownContainerProps {
  links: DriveLink[];
  onRefresh: () => void;
}

export function AdminTakedownContainer({ links, onRefresh }: AdminTakedownContainerProps) {
  const [targetQuery, setTargetQuery] = useState("");
  const [takedownReason, setTakedownReason] = useState("");
  const [actionType, setActionType] = useState<"hide" | "remove">("hide");
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [executing, setExecuting] = useState(false);

  // Filter hidden or quarantined works
  const suppressedLinks = links.filter((l) => l.status === "hidden" || l.status === "rejected");

  async function handleSingleWorkTakedown(e: React.FormEvent) {
    e.preventDefault();
    if (!targetQuery.trim()) {
      setStatusFeedback({ type: "error", text: "Please enter a valid Work ID or exact story title." });
      return;
    }

    setExecuting(true);
    setStatusFeedback(null);

    try {
      const query = targetQuery.trim().toLowerCase();
      // Match by exact ID or title
      const matched = links.find(
        (l) => l.id.toLowerCase() === query || l.title.toLowerCase().includes(query)
      );

      if (!matched) {
        setStatusFeedback({
          type: "error",
          text: `No work found matching "${targetQuery}". Please verify the Work ID or Title.`,
        });
        return;
      }

      if (actionType === "hide") {
        hideLink(matched.id);
        setStatusFeedback({
          type: "success",
          text: `Successfully quarantined "${matched.title}" (ID: ${matched.id}). Sibling works sharing this cloud drive remain unaffected.`,
        });
      } else {
        removeLink(matched.id);
        setStatusFeedback({
          type: "success",
          text: `Permanently purged record for "${matched.title}" (ID: ${matched.id}). Parent cloud folder was preserved.`,
        });
      }

      setTargetQuery("");
      setTakedownReason("");
      onRefresh();
    } catch (err: unknown) {
      setStatusFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to execute takedown.",
      });
    } finally {
      setExecuting(false);
    }
  }

  function handleUnhide(id: string, title: string) {
    try {
      unhideLink(id);
      setStatusFeedback({
        type: "success",
        text: `Restored "${title}" to verified archive index.`,
      });
      onRefresh();
    } catch (err: unknown) {
      setStatusFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to restore work.",
      });
    }
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border-2 border-amber-300 dark:border-amber-900/60 rounded-xl p-5 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <h2 className="text-base font-bold text-brand-bark dark:text-brand-light">
              Admin Takedown & Granular Work Suppression Desk
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Enforce instant author sovereignty. Target and take down individual fanfics even when multiple works share a single OneDrive or Google Drive folder.
          </p>
        </div>

        <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-brand-trunk dark:text-brand-light border border-red-300 dark:border-red-800 px-2.5 py-1 rounded font-mono font-bold shrink-0">
          ADMINISTRATOR PRIVILEGES
        </span>
      </div>

      {statusFeedback && (
        <div
          className={`p-3 text-xs rounded-lg border ${
            statusFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          {statusFeedback.text}
        </div>
      )}

      {/* Form: Granular Single Work Takedown */}
      <div className="bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg p-4 space-y-3">
        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>🎯</span>
          <span>Granular Single-Work Takedown (Multi-Fic OneDrive / Drive Support)</span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
          When an author requests removal of one story from a shared multi-work drive link, enter that work&apos;s title or ID below. This suppresses <strong>only</strong> that fanfic without affecting other stories in the folder.
        </p>

        <form onSubmit={handleSingleWorkTakedown} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Work ID or Exact Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. link-001 or To Build a Home"
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-brand-trunk outline-hidden"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Author Reach-Out / Audit Reason
            </label>
            <input
              type="text"
              placeholder="Author requested fast-track removal"
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-brand-trunk outline-hidden"
            />
          </div>

          <div className="sm:col-span-3 flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as "hide" | "remove")}
                className="w-1/2 px-2 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              >
                <option value="hide">Quarantine (Hide)</option>
                <option value="remove">Expunge (Purge)</option>
              </select>
              <button
                type="submit"
                disabled={executing}
                className="w-1/2 px-3 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {executing ? "Processing..." : "Take Down"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Suppressed / Takedown Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-800 dark:text-gray-200">
            Active Suppressed / Quarantined Fanworks ({suppressedLinks.length})
          </span>
          <span className="text-[11px] text-gray-500">
            Works hidden from public view under author takedown policy
          </span>
        </div>

        {suppressedLinks.length === 0 ? (
          <div className="p-4 bg-canvas-light dark:bg-canvas-dark rounded-lg border border-border-light dark:border-border-dark text-center text-xs text-gray-500">
            No works are currently quarantined or suppressed.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-light dark:border-border-dark rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-light dark:bg-canvas-dark text-gray-600 dark:text-gray-400 border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="p-2.5">Work Title</th>
                  <th className="p-2.5">Author</th>
                  <th className="p-2.5">Fandom</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {suppressedLinks.map((item) => (
                  <tr key={item.id} className="hover:bg-subtle-light dark:hover:bg-subtle-dark transition">
                    <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                      <div className="text-[10px] text-gray-500 font-mono">{item.id}</div>
                    </td>
                    <td className="p-2.5 text-gray-700 dark:text-gray-300">{item.authorName}</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">{item.fandom}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleUnhide(item.id, item.title)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition shadow-2xs"
                      >
                        Restore to Index
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
