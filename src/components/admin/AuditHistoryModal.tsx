"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  fetchLinkAuditHistoryFromApi,
  exportAuditToCsv,
  printAuditReport,
  LinkAuditRecord,
} from "@/lib/auditService";

interface AuditHistoryModalProps {
  linkId: string | null;
  workTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditHistoryModal({
  linkId,
  workTitle,
  isOpen,
  onClose,
}: AuditHistoryModalProps) {
  const [history, setHistory] = useState<LinkAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !linkId) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchLinkAuditHistoryFromApi(linkId)
      .then((records) => {
        if (active) setHistory(records);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load audit logs."
          );
          setHistory([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, linkId]);

  if (!isOpen || !linkId || !mounted) return null;

  const primary = history[history.length - 1] || history[0];
  const displayTitle = workTitle || primary?.workTitle || "Fanwork Submission";

  const actionColors: Record<string, string> = {
    UPLOADED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    SCANNED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    VERIFIED: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    HIDDEN: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700",
    UNHIDDEN: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    REJECTED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    EXPUNGED: "bg-red-600 text-white border-red-700 font-bold animate-pulse",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3
                id="audit-modal-title"
                className="text-base font-bold text-gray-900 dark:text-gray-100"
              >
                Lifecycle Audit History
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chronological operator actions, threat scans, approvals, and takedown records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1 rounded-md"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Work Overview Sub-banner */}
        <div className="px-5 py-3 border-b border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong className="text-gray-900 dark:text-gray-100 text-sm block">
              {displayTitle}
            </strong>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              ID: {linkId}
            </span>
          </div>

          {/* Export Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportAuditToCsv(history, `audit_${linkId}`)}
              disabled={history.length === 0}
              className="px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark rounded-lg text-gray-800 dark:text-gray-200 text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
              title="Download audit trail as CSV spreadsheet"
            >
              <span>📥</span> Export CSV
            </button>

            <button
              type="button"
              onClick={() => printAuditReport(linkId, history)}
              disabled={history.length === 0}
              className="px-2.5 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
              title="Generate printable PDF compliance certificate"
            >
              <span>🖨️</span> Export PDF
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              Loading Supabase audit history...
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-xs">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              No audit records logged for this link yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-border-light dark:border-border-dark ml-3 pl-4 space-y-5">
              {history.map((record) => (
                <div key={record.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-brand-trunk border-2 border-surface-light dark:border-surface-dark shadow-xs" />

                  <div className="bg-canvas-light dark:bg-canvas-dark p-3.5 rounded-lg border border-border-light dark:border-border-dark space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            actionColors[record.actionType] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {record.actionType}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          by {record.actorName}
                        </span>
                        <span className="text-[10px] bg-subtle-light dark:bg-subtle-dark px-1.5 py-0.2 rounded uppercase text-gray-500 font-mono">
                          {record.actorRole}
                        </span>
                      </div>

                      <span className="text-[11px] text-gray-400">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {record.notes && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 italic bg-surface-light dark:bg-surface-dark p-2 rounded border border-border-light dark:border-border-dark mt-1">
                        &ldquo;{record.notes}&rdquo;
                      </p>
                    )}

                    {record.isTombstone && (
                      <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 pt-1">
                        <span>⚠️</span> Permanent Tombstone Record (Work expunged from live index)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex items-center justify-between text-xs">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Records are immutable and preserved for compliance.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
