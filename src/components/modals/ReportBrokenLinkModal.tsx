"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

interface ReportBrokenLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  workId: string;
  workTitle: string;
}

const REASONS = [
  "File not found / Deleted on Google Drive (404)",
  "Access restricted / Requires author permission (403)",
  "Wrong or empty file",
  "Corrupted document / Failed to render",
  "Other accessibility issue",
];

export function ReportBrokenLinkModal({
  isOpen,
  onClose,
  workId,
  workTitle,
}: ReportBrokenLinkModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fullReason = notes.trim()
        ? `${reason} — ${notes.trim()}`
        : reason;

      const res = await fetch("/api/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId,
          targetQuery: workTitle,
          role: "community",
          reason: fullReason,
          ownershipProof: `Community reader report: ${reason}`,
          preference: "hide",
          requesterEmail: email.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit broken link report.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to report link.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-broken-link-title"
    >
      <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
          <div className="space-y-1">
            <h3
              id="report-broken-link-title"
              className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"
            >
              <span>🚨</span>
              <span>Report Broken or Inaccessible Link</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Flag this work for administrator inspection and fast-track removal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none p-1 rounded-md"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
              ✓
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Report Received
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                Thank you for keeping OurArchive clean. This fanwork has been flagged and routed to the administrator triage queue.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg text-xs font-semibold transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {error && (
              <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="p-2.5 rounded bg-subtle-light dark:bg-subtle-dark border border-border-light dark:border-border-dark space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                Target Fanwork
              </span>
              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {workTitle || "Untitled Fanwork"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Issue Encountered
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Shows 404 in Google Drive, or was moved to another folder..."
                rows={2}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Your Email (Optional, for status updates)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@example.com"
                className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded-lg bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 outline-hidden focus:ring-1 focus:ring-brand-trunk"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-2 border border-border-light dark:border-border-dark rounded-lg text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>🚨</span>
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
