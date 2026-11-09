"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DriveLink } from "@/lib/types";
import { runSystemLinkScan, SystemScanReport } from "@/lib/rbacService";
import { AuditHistoryModal } from "@/components/admin/AuditHistoryModal";

interface LinkInspectionModalProps {
  link: DriveLink | null;
  isOpen: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onApprove: (id: string, isPriorVerified: boolean) => void;
  onReject: (id: string) => void;
  onHide?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function LinkInspectionModal({
  link,
  isOpen,
  isAdmin = false,
  onClose,
  onApprove,
  onReject,
  onHide,
  onRemove,
}: LinkInspectionModalProps) {
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [isPriorVerified, setIsPriorVerified] = useState(false);
  const [scanReport, setScanReport] = useState<SystemScanReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSafetyAcknowledged(false);
      setIsPriorVerified(link?.isPriorVerified || false);
      setScanReport(null);
      setIsScanning(false);
      setShowAuditModal(false);
    }
  }, [isOpen, link]);

  if (!isOpen || !link || !mounted) return null;

  function handleRunScan() {
    if (!link) return;
    setIsScanning(true);
    setTimeout(() => {
      const report = runSystemLinkScan(link.rawDriveUrl);
      setScanReport(report);
      setIsScanning(false);
    }, 450);
  }

  const isMalicious =
    link.status === "flagged" ||
    link.automatedRiskScore >= 70 ||
    scanReport?.verdict === "MALICIOUS";

  const isQuarantined = link.status === "hidden" || link.status === "rejected";
  const canPermanentDelete = isAdmin && (isQuarantined || isMalicious);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
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
              {isAdmin && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Admin Mode
                </span>
              )}
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
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {link.title}
                </h4>
                {link.status === "flagged" && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 uppercase shrink-0">
                    ⚠️ Threat Flagged
                  </span>
                )}
              </div>

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
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 dark:bg-red-950/50 text-brand-bark dark:text-brand-light border border-red-200 dark:border-red-900/60">
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

            {/* 1. SYSTEM-BASED AUTOMATED SCANNER BUTTON & REPORT */}
            <div className="p-4 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 block">
                    Automated Link & Content Checker
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Runs pre-approval heuristics to check domain validity, MIME signatures, and executable macros.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 rounded-md font-semibold text-xs transition disabled:opacity-50 shrink-0"
                >
                  {isScanning ? "Scanning Payload..." : "Run Security Scanner"}
                </button>
              </div>

              {scanReport && (
                <div
                  className={`p-3 rounded-md border text-xs space-y-2 animate-in fade-in duration-150 ${
                    scanReport.verdict === "CLEAN"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Automated Scan Verdict:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        scanReport.verdict === "CLEAN"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse"
                      }`}
                    >
                      {scanReport.verdict === "CLEAN"
                        ? "✓ Safe (Risk Score: 0%)"
                        : `⚠️ Malicious Threat (${scanReport.riskScore}%)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-600 dark:text-gray-400">
                    <div>View-Only Permissions: <strong className={scanReport.isViewOnlyConfirmed ? "text-emerald-600" : "text-red-600"}>{scanReport.isViewOnlyConfirmed ? "CONFIRMED" : "UNVERIFIED"}</strong></div>
                    <div>Detected MIME: <strong className="text-gray-800 dark:text-gray-200">{scanReport.detectedMime}</strong></div>
                  </div>
                  {scanReport.threatFlags.length > 0 && (
                    <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                      Threat Flags: {scanReport.threatFlags.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. PRIOR VERIFICATION OVERRIDE CHECKBOX */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPriorVerified}
                onChange={(e) => setIsPriorVerified(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-brand-trunk focus:ring-brand-trunk"
              />
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                  Assign prior verification override (isVerifiedPrior)
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  If checked, upon approval this work will be assigned the <strong>&ldquo;VERIFIED BY ADMIN&rdquo;</strong> badge.
                </span>
              </div>
            </label>

            {/* 3. SAFETY WARNING & MANDATORY CHECKBOX */}
            <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="text-base text-amber-600 dark:text-amber-400 shrink-0">⚠️</span>
                <div>
                  <strong className="block text-amber-900 dark:text-amber-300 text-xs">
                    Verifier Manual Inspection Caution
                  </strong>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed mt-0.5">
                    Opening unfamiliar external links carries inherent risks. You can manually inspect this link, but please judge the link first and exercise caution regarding external link credibility before opening.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={safetyAcknowledged}
                  onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-brand-trunk focus:ring-brand-trunk dark:bg-gray-800 dark:border-amber-700"
                />
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  I have judged the link credibility, will exercise caution, and understand safety precautions before manually opening this link.
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
                    title="Check the caution box above to unlock external link inspection"
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded-md text-gray-700 dark:text-gray-300 hover:bg-canvas-light dark:hover:bg-canvas-dark text-xs font-medium transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-300 dark:border-purple-800 rounded-md text-xs font-semibold transition flex items-center gap-1"
                title="View full audit lifecycle timeline and export PDF/CSV"
              >
                <span>📜</span> Audit History
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* ADMIN EXCLUSIVE: HIDE (Quarantine) */}
              {isAdmin && onHide && (
                <button
                  type="button"
                  onClick={() => {
                    onHide(link.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition"
                  title="Quarantine link for author takedown checking"
                >
                  👁️ Hide
                </button>
              )}

              {/* ADMIN EXCLUSIVE: PERMANENT DELETE (Only if Hidden/Rejected/Malicious) */}
              {canPermanentDelete && onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove(link.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition shadow-xs"
                  title="Permanently remove and expunge from database"
                >
                  🗑️ Permanent Delete
                </button>
              )}

              {/* VERIFIER & ADMIN: REJECT */}
              <button
                type="button"
                onClick={() => {
                  onReject(link.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition"
              >
                ❌ Reject
              </button>

              {/* VERIFIER & ADMIN: APPROVE */}
              <button
                type="button"
                onClick={() => {
                  onApprove(link.id, isPriorVerified);
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

      {/* Audit History & CSV / PDF Export Modal */}
      <AuditHistoryModal
        linkId={link?.id || null}
        workTitle={link?.title}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </>,
    document.body
  );
}
