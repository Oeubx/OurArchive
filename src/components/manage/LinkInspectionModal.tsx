"use client";

import React, { useState } from "react";
import { DriveLink } from "@/lib/types";

interface LinkInspectionModalProps {
  link: DriveLink | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onHide: (id: string) => void;
}

export function LinkInspectionModal({
  link,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onHide,
}: LinkInspectionModalProps) {
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  if (!isOpen || !link) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3
              id="inspection-modal-title"
              className="text-base font-bold text-gray-900 dark:text-gray-100"
            >
              Inspect Fanwork Submission
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1 rounded-md"
            aria-label="Close inspection modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700 dark:text-gray-300">
          {/* Fanwork Primary Details */}
          <div className="space-y-1.5 border-b border-border-light dark:border-border-dark pb-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {link.title}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
              <span>Author: <strong className="text-gray-800 dark:text-gray-200">{link.authorName}</strong></span>
              <span>•</span>
              <span>Fandom: <strong className="text-gray-800 dark:text-gray-200">{link.fandom}</strong></span>
              {link.pairing && (
                <>
                  <span>•</span>
                  <span>Pairing: <strong className="text-gray-800 dark:text-gray-200">{link.pairing}</strong></span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 dark:bg-red-950/50 text-ao3-darkred dark:text-ao3-lightred border border-red-200 dark:border-red-900/60">
                {link.rating}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {link.wordCount.toLocaleString()} words
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Submitted by: <code className="font-mono text-gray-700 dark:text-gray-300">@{link.uploadedBy}</code>
              </span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <span className="font-semibold block text-gray-800 dark:text-gray-200 mb-1">
              Archival Summary:
            </span>
            <p className="p-3 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-300 leading-relaxed italic">
              &ldquo;{link.summary}&rdquo;
            </p>
          </div>

          {/* Drive & Submitter Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark text-[11px]">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-medium">Masked Drive Link:</span>
              <span className="font-mono text-gray-800 dark:text-gray-200 break-all select-all">
                {link.maskedDriveUrl}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-medium">Drive Owner / Submitter:</span>
              <span className="text-gray-800 dark:text-gray-200">
                {link.driveOwnerEmail ? link.driveOwnerEmail : "Anonymous Community Upload"}
              </span>
            </div>
          </div>

          {/* SAFETY WARNING & MANDATORY CHECKBOX */}
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-base text-amber-600 dark:text-amber-400 shrink-0">⚠️</span>
              <div>
                <strong className="block text-amber-900 dark:text-amber-300 text-xs">
                  Verifier Safety Warning & Caution
                </strong>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed mt-0.5">
                  Opening unfamiliar external links carries inherent risks. Please judge the link first, check metadata for view-only permissions, and do not execute or download unknown binary files.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={safetyAcknowledged}
                onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-ao3-red focus:ring-ao3-red dark:bg-gray-800 dark:border-amber-700"
              />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                I have reviewed the metadata, will exercise caution, and understand the safety precautions before inspecting this link.
              </span>
            </label>

            {/* "View Link" Button - Strictly disabled until checkbox is checked */}
            <div className="pt-1">
              {safetyAcknowledged ? (
                <a
                  href={link.rawDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition shadow-xs"
                >
                  <span>🔗</span> View Link (External Google Drive ↗)
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Check the safety warning box above to unlock external link inspection"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-md font-semibold text-xs cursor-not-allowed"
                >
                  <span>🔒</span> View Link (Locked until caution confirmed)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Decisions Bar */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded-md text-gray-700 dark:text-gray-300 hover:bg-canvas-light dark:hover:bg-canvas-dark text-xs font-medium transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onHide(link.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition"
            >
              👁️ Hide
            </button>
            <button
              type="button"
              onClick={() => {
                onReject(link.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition"
            >
              ❌ Reject
            </button>
            <button
              type="button"
              onClick={() => {
                onApprove(link.id);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition shadow-xs"
            >
              ✅ Approve (Publish to Archive)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
