"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { DriveLink } from "@/lib/types";
import type { TakedownRequestRecord } from "@/types/database";
import { exportAuditToCsv, type LinkAuditRecord } from "@/lib/auditService";

interface AdminTakedownContainerProps {
  links: DriveLink[];
  onRefresh: () => void;
}

export function AdminTakedownContainer({
  links,
  onRefresh,
}: AdminTakedownContainerProps) {
  const [targetQuery, setTargetQuery] = useState("");
  const [takedownReason, setTakedownReason] = useState("");
  const [actionType, setActionType] = useState<"hide" | "remove">("hide");
  const [statusFeedback, setStatusFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [executing, setExecuting] = useState(false);

  const [takedownQueue, setTakedownQueue] = useState<TakedownRequestRecord[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );

  const loadTakedownQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/admin/takedowns", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTakedownQueue(Array.isArray(data.requests) ? data.requests : []);
      }
    } catch {
      // Non-admin contexts or transient network errors leave queue empty
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadTakedownQueue();
  }, [loadTakedownQueue, links.length]);

  const suppressedLinks = links.filter(
    (l) => l.status === "hidden" || l.status === "rejected"
  );

  async function callAdminAction(
    linkId: string,
    type: "HIDE" | "UNHIDE" | "REMOVE",
    reason: string
  ): Promise<{ auditRecords?: LinkAuditRecord[] }> {
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId,
        actionType: type,
        reason,
        hardDelete: type === "REMOVE",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Failed to execute ${type} action.`);
    }
    return data;
  }

  async function handleSingleWorkTakedown(e: React.FormEvent) {
    e.preventDefault();
    if (!targetQuery.trim()) {
      setStatusFeedback({
        type: "error",
        text: "Please enter a valid Work ID or exact story title.",
      });
      return;
    }

    setExecuting(true);
    setStatusFeedback(null);

    try {
      const query = targetQuery.trim().toLowerCase();
      const matched = links.find(
        (l) =>
          l.id.toLowerCase() === query ||
          l.title.toLowerCase().includes(query)
      );

      if (!matched) {
        setStatusFeedback({
          type: "error",
          text: `No work found matching "${targetQuery}". Please verify the Work ID or Title.`,
        });
        return;
      }

      const reason =
        takedownReason.trim() ||
        "Granular takedown action executed from Admin Desk.";

      if (actionType === "hide") {
        await callAdminAction(matched.id, "HIDE", reason);
        setStatusFeedback({
          type: "success",
          text: `Successfully quarantined "${matched.title}" in Supabase.`,
        });
      } else {
        const res = await callAdminAction(matched.id, "REMOVE", reason);
        if (res.auditRecords && res.auditRecords.length > 0) {
          exportAuditToCsv(
            res.auditRecords,
            `ourarchive_purge_${matched.id.slice(0, 8)}`
          );
        }
        setStatusFeedback({
          type: "success",
          text: `Permanently deleted "${matched.title}" from the database and exported compliance CSV.`,
        });
      }

      setTargetQuery("");
      setTakedownReason("");
      await loadTakedownQueue();
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

  async function handleUnhide(id: string, title: string) {
    setExecuting(true);
    setStatusFeedback(null);
    try {
      await callAdminAction(id, "UNHIDE", "Restored to verified archive index.");
      setStatusFeedback({
        type: "success",
        text: `Restored "${title}" to verified archive index in Supabase.`,
      });
      await loadTakedownQueue();
      onRefresh();
    } catch (err: unknown) {
      setStatusFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to restore work.",
      });
    } finally {
      setExecuting(false);
    }
  }

  async function handleRequestResolution(
    req: TakedownRequestRecord,
    action: "quarantine" | "purge" | "dismiss"
  ) {
    setProcessingRequestId(req.id);
    setStatusFeedback(null);
    try {
      if (action === "purge" && req.link_id) {
        const res = await callAdminAction(
          req.link_id,
          "REMOVE",
          `Takedown Request Verified (${req.requester_role}): ${req.ownership_proof}`
        );
        if (res.auditRecords && res.auditRecords.length > 0) {
          exportAuditToCsv(
            res.auditRecords,
            `ourarchive_purge_${req.link_id.slice(0, 8)}`
          );
        }
        setStatusFeedback({
          type: "success",
          text: `Permanently deleted targeted work "${req.work_title_snapshot || req.target_query}" and exported compliance CSV.`,
        });
      } else if (action === "quarantine" && req.link_id) {
        await callAdminAction(
          req.link_id,
          "HIDE",
          `Quarantined via Takedown Queue (${req.requester_role}): ${req.ownership_proof}`
        );
        setStatusFeedback({
          type: "success",
          text: `Quarantined "${req.work_title_snapshot || req.target_query}".`,
        });
      } else {
        const nextStatus = action === "dismiss" ? "dismissed" : "purged";
        const patchRes = await fetch("/api/admin/takedowns", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: req.id, status: nextStatus }),
        });
        if (!patchRes.ok) {
          const err = await patchRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update takedown request.");
        }
        setStatusFeedback({
          type: "success",
          text: `Marked takedown request as ${nextStatus}.`,
        });
      }

      await loadTakedownQueue();
      onRefresh();
    } catch (err: unknown) {
      setStatusFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to process takedown request.",
      });
    } finally {
      setProcessingRequestId(null);
    }
  }

  const openRequests = takedownQueue.filter(
    (r) => r.status === "pending" || r.status === "quarantined"
  );

  return (
    <div className="bg-surface-light dark:bg-surface-dark border-2 border-amber-300 dark:border-amber-900/60 rounded-xl p-5 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <h2 className="text-base font-bold text-brand-bark dark:text-brand-light">
              Admin Takedown &amp; Granular Work Suppression Desk
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Review Supabase takedown submissions with exact Google Drive targets and proof of ownership, or suppress individual fanworks directly.
          </p>
        </div>

        <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-brand-trunk dark:text-brand-light border border-red-300 dark:border-red-800 px-2.5 py-1 rounded font-mono font-bold shrink-0 self-start sm:self-auto">
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

      {/* Incoming Supabase Takedown Requests Queue */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-gray-800 dark:text-gray-200">
            Incoming In-System Takedown Requests ({openRequests.length} active / {takedownQueue.length} total)
          </span>
          <button
            type="button"
            onClick={loadTakedownQueue}
            className="text-[11px] text-brand-trunk dark:text-brand-light font-semibold hover:underline"
          >
            ↻ Refresh Queue
          </button>
        </div>

        {loadingQueue ? (
          <div className="p-4 bg-canvas-light dark:bg-canvas-dark rounded-lg border border-border-light dark:border-border-dark text-center text-xs text-gray-500">
            Loading takedown requests from Supabase...
          </div>
        ) : takedownQueue.length === 0 ? (
          <div className="p-4 bg-canvas-light dark:bg-canvas-dark rounded-lg border border-border-light dark:border-border-dark text-center text-xs text-gray-500">
            No in-system takedown requests logged in Supabase yet.
          </div>
        ) : (
          <div className="space-y-3">
            {takedownQueue.map((req) => {
              const pointedDrive =
                req.resolved_drive_url || req.submitted_drive_url;
              const isOpen =
                req.status === "pending" || req.status === "quarantined";
              const isBusy = processingRequestId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {req.work_title_snapshot || req.target_query}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Role: <strong>{req.requester_role}</strong> • Contact:{" "}
                        <strong>{req.requester_email || "Not provided"}</strong>{" "}
                        • Scope:{" "}
                        <strong className="uppercase">{req.removal_preference}</strong>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        req.status === "purged"
                          ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
                          : req.status === "quarantined"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          : req.status === "dismissed"
                          ? "bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Pointed Google Drive Link */}
                  <div className="p-2.5 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1 text-[11px]">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      Targeted Google Drive Link:
                    </div>
                    {pointedDrive ? (
                      <a
                        href={pointedDrive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-brand-trunk dark:text-brand-light hover:underline break-all block"
                      >
                        {pointedDrive}
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">
                        No direct Drive URL resolved (Query: {req.target_query})
                      </span>
                    )}
                    {req.resolved_drive_url &&
                      req.submitted_drive_url &&
                      req.resolved_drive_url !== req.submitted_drive_url && (
                        <div className="text-[10px] text-gray-500 break-all">
                          Submitted URL: {req.submitted_drive_url}
                        </div>
                      )}
                  </div>

                  {/* Dedicated Proof of Ownership / Credibility */}
                  <div className="p-2.5 rounded bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-1 text-[11px]">
                    <div className="font-semibold text-amber-900 dark:text-amber-300">
                      Proof of Ownership / Credibility:
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {req.ownership_proof}
                    </p>
                  </div>

                  {req.reason && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-400">
                      <strong>Notes:</strong> {req.reason}
                    </div>
                  )}

                  {isOpen && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {req.link_id && req.status === "pending" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRequestResolution(req, "quarantine")}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition disabled:opacity-50"
                        >
                          Quarantine Link
                        </button>
                      )}
                      {req.link_id && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRequestResolution(req, "purge")}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition disabled:opacity-50"
                        >
                          {isBusy ? "Deleting..." : "Permanently Delete & Export CSV"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRequestResolution(req, "dismiss")}
                        className="px-2.5 py-1 border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark rounded text-[11px] font-medium transition disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form: Granular Single Work Takedown */}
      <div className="bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg p-4 space-y-3">
        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>🎯</span>
          <span>Granular Single-Work Takedown (Direct Admin Action)</span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
          Enter a Work ID or Title below to hide or permanently delete a specific fanwork directly in Supabase without affecting other entries.
        </p>

        <form
          onSubmit={handleSingleWorkTakedown}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1"
        >
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Work ID or Exact Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UUID or Story Title"
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
                onChange={(e) =>
                  setActionType(e.target.value as "hide" | "remove")
                }
                className="w-1/2 px-2 py-1.5 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              >
                <option value="hide">Hide (Quarantine)</option>
                <option value="remove">Permanently Delete</option>
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
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
                  <tr
                    key={item.id}
                    className="hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                  >
                    <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                      <div className="text-[10px] text-gray-500 font-mono">
                        {item.id}
                      </div>
                    </td>
                    <td className="p-2.5 text-gray-700 dark:text-gray-300">
                      {item.authorName}
                    </td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-400">
                      {item.fandom}
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        disabled={executing}
                        onClick={() => handleUnhide(item.id, item.title)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition shadow-2xs disabled:opacity-50"
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
