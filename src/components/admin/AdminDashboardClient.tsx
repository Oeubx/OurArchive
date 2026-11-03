"use client";

import React, { useState, useEffect } from "react";
import { DriveLink, UserRole } from "@/lib/types";
import {
  getAllCommunityLinks,
  getArchiveMetrics,
  getCurrentUserRole,
  setSimulatedRole,
  approveLink,
  rejectLink,
  hideLink,
  unhideLink,
  verifyLink,
  removeLink,
  subscribeToRbacUpdates,
} from "@/lib/rbacService";
import { VerifierRequestsModal } from "./VerifierRequestsModal";
import { AdminDirectUploadModal } from "./AdminDirectUploadModal";
import { LinkInspectionModal } from "@/components/manage/LinkInspectionModal";

interface AdminDashboardClientProps {
  adminEmail: string;
}

export function AdminDashboardClient({ adminEmail }: AdminDashboardClientProps) {
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [role, setRole] = useState<UserRole>("admin");
  const [metrics, setMetrics] = useState({
    approvedCount: 0,
    underVerificationCount: 0,
    hiddenCount: 0,
    rejectedCount: 0,
    flaggedCount: 0,
    pendingApplicationsCount: 0,
    totalLinksCount: 0,
  });

  const [filter, setFilter] = useState<string>("all");
  const [showVerifierRequestsModal, setShowVerifierRequestsModal] = useState(false);
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);
  const [inspectingLink, setInspectingLink] = useState<DriveLink | null>(null);
  const [itemToRemove, setItemToRemove] = useState<DriveLink | null>(null);

  function refresh() {
    setRole(getCurrentUserRole());
    setLinks(getAllCommunityLinks());
    setMetrics(getArchiveMetrics());
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToRbacUpdates(() => {
      refresh();
    });
    return unsubscribe;
  }, []);

  const filteredLinks = links.filter((item) => {
    if (filter === "all") return true;
    if (filter === "pending") return item.status === "under_verification";
    if (filter === "approved") return item.status === "approved";
    if (filter === "hidden") return item.status === "hidden";
    if (filter === "flagged") return item.status === "flagged" || item.automatedRiskScore >= 70;
    if (filter === "rejected") return item.status === "rejected";
    return true;
  });

  function handleConfirmRemove() {
    if (!itemToRemove) return;
    removeLink(itemToRemove.id);
    setItemToRemove(null);
  }

  return (
    <div className="space-y-6">
      {/* Administrator Status & Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">Active Administrator:</span>
          <strong className="text-gray-900 dark:text-gray-100">{adminEmail}</strong>
          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
            RBAC: admin (authorized)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDirectUploadModal(true)}
            className="px-3.5 py-1.5 bg-ao3-red hover:bg-ao3-darkred text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>+</span> Admin Direct Upload
          </button>
        </div>
      </div>

      {/* Queue Metrics & Interactive Pending Requests Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Works */}
        <div className="bg-surface-light dark:bg-surface-dark border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl shadow-xs">
          <span className="text-emerald-800 dark:text-emerald-400 text-[11px] block uppercase font-bold tracking-wider">
            Approved Works
          </span>
          <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">
            {metrics.approvedCount}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
            Active in public index
          </span>
        </div>

        {/* Under Verification */}
        <div className="bg-surface-light dark:bg-surface-dark border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl shadow-xs">
          <span className="text-amber-800 dark:text-amber-400 text-[11px] block uppercase font-bold tracking-wider">
            Under Verification
          </span>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
            {metrics.underVerificationCount}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
            Awaiting triage review
          </span>
        </div>

        {/* CLICKABLE CONTAINER: PENDING VERIFIER REQUESTS (N) */}
        <div
          onClick={() => setShowVerifierRequestsModal(true)}
          className="bg-amber-50/80 dark:bg-amber-950/30 border-2 border-dashed border-amber-400 dark:border-amber-600/70 hover:border-amber-500 p-4 rounded-xl shadow-xs cursor-pointer transition hover:scale-[1.01] group relative overflow-hidden"
          role="button"
          tabIndex={0}
          aria-label="Review pending verifier applications"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-amber-900 dark:text-amber-300 text-[11px] block uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span>👥</span> Verifier Requests
              </span>
              <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1 block">
                {metrics.pendingApplicationsCount}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 uppercase">
              Action Req.
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-ao3-red dark:text-ao3-lightred flex items-center gap-1 group-hover:underline">
            <span>Click to Review Applicants</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </div>
        </div>

        {/* Total Ingested */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-xs">
          <span className="text-gray-600 dark:text-gray-400 text-[11px] block uppercase font-bold tracking-wider">
            Total Submissions
          </span>
          <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1 block">
            {metrics.totalLinksCount}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
            All database submissions
          </span>
        </div>
      </div>

      {/* Administrative 5-Action Triage Suite */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Administrative 5-Action Triage Suite
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Categorized queue management: Verify, Approve, Reject, Quarantine Hide, or Permanent Expunge.
            </p>
          </div>

          {/* Categorized Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: `All (${links.length})` },
              { id: "pending", label: `Pending (${metrics.underVerificationCount})` },
              { id: "approved", label: `Approved (${metrics.approvedCount})` },
              { id: "hidden", label: `Hidden / Quarantine (${metrics.hiddenCount})` },
              { id: "flagged", label: `Threat Flags (${metrics.flaggedCount})` },
              { id: "rejected", label: `Rejected (${metrics.rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  filter === tab.id
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-2xs"
                    : "bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-300 border border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Triage Table */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Work & Author</th>
                  <th className="py-3 px-4">Masked Link</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                      No submissions found matching the &ldquo;{filter}&rdquo; filter.
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((item) => {
                    const isMaliciousThreat =
                      item.status === "flagged" || (item.automatedRiskScore ?? 0) >= 70;
                    const isQuarantined = item.status === "hidden" || item.status === "rejected";
                    const canDelete = isQuarantined || isMaliciousThreat;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setInspectingLink(item)}
                        className="hover:bg-subtle-light dark:hover:bg-subtle-dark/60 cursor-pointer transition"
                      >
                        {/* Work & Author */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-gray-900 dark:text-gray-100 hover:text-ao3-red transition">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <span>by {item.authorName}</span>
                            <span>•</span>
                            <span>{item.fandom}</span>
                          </div>
                          {item.verificationBadge && (
                            <div className="mt-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                ✓ {item.verificationBadge}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Masked Link */}
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                          <span className="bg-canvas-light dark:bg-canvas-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">
                            {item.maskedDriveUrl}
                          </span>
                        </td>

                        {/* Submitter */}
                        <td className="py-3 px-4 text-[11px] text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            @{item.uploadedBy}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {item.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <span>🟢</span> Approved
                            </span>
                          ) : item.status === "under_verification" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <span>🟡</span> Pending
                            </span>
                          ) : item.status === "hidden" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                              <span>👁️</span> Hidden (Quarantine)
                            </span>
                          ) : item.status === "flagged" || (item.automatedRiskScore ?? 0) >= 70 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                              <span>🚨</span> Threat Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <span>❌</span> Rejected
                            </span>
                          )}
                        </td>

                        {/* 5-Action Suite */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {/* Inspect */}
                            <button
                              type="button"
                              onClick={() => setInspectingLink(item)}
                              title="Inspect metadata, run scanner, and triage"
                              className="px-2 py-1 bg-subtle-light dark:bg-subtle-dark hover:bg-ao3-red hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition"
                            >
                              🔍 Inspect
                            </button>

                            {/* VERIFY */}
                            <button
                              type="button"
                              onClick={() => verifyLink(item.id)}
                              title="Verify and certify link"
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition"
                            >
                              Verify
                            </button>

                            {/* APPROVE */}
                            <button
                              type="button"
                              onClick={() => approveLink(item.id, "biboy_admin", item.isPriorVerified)}
                              title="Approve and publish"
                              className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold transition"
                            >
                              Approve
                            </button>

                            {/* REJECT */}
                            <button
                              type="button"
                              onClick={() => rejectLink(item.id, "biboy_admin")}
                              title="Reject submission"
                              className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white rounded border border-amber-200 dark:border-amber-800 text-[11px] font-semibold transition"
                            >
                              Reject
                            </button>

                            {/* HIDE / UNHIDE */}
                            {item.status === "hidden" ? (
                              <button
                                type="button"
                                onClick={() => unhideLink(item.id)}
                                title="Restore visibility"
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition"
                              >
                                Unhide
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => hideLink(item.id)}
                                title="Quarantine work for author takedown checking"
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition"
                              >
                                Hide
                              </button>
                            )}

                            {/* PERMANENT REMOVE / PURGE ACTION */}
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => setItemToRemove(item)}
                                title={
                                  isMaliciousThreat
                                    ? "Emergency Threat Purge (Malicious/Hazard Deemed by System)"
                                    : "Permanent Expunge (Author Takedown Request)"
                                }
                                className={`px-2 py-1 rounded text-[11px] font-bold transition shadow-2xs ${
                                  isMaliciousThreat
                                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                    : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 hover:bg-red-600 hover:text-white"
                                }`}
                              >
                                {isMaliciousThreat ? "🚨 Purge" : "🗑️ Delete"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Fanwork must be placed in Hidden or Rejected state before permanent deletion, unless deemed malicious by threat scanner"
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 rounded text-[11px] cursor-not-allowed"
                              >
                                🔒
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Link Inspection Modal */}
      <LinkInspectionModal
        link={inspectingLink}
        isOpen={!!inspectingLink}
        isAdmin={true}
        onClose={() => setInspectingLink(null)}
        onApprove={(id, isPriorVerified) => {
          approveLink(id, "biboy_admin", isPriorVerified);
        }}
        onReject={(id) => {
          rejectLink(id, "biboy_admin");
        }}
        onHide={(id) => {
          hideLink(id);
        }}
        onRemove={(id) => {
          const target = links.find((l) => l.id === id);
          if (target) setItemToRemove(target);
        }}
      />

      {/* Verifier Applications Review Modal */}
      <VerifierRequestsModal
        isOpen={showVerifierRequestsModal}
        onClose={() => setShowVerifierRequestsModal(false)}
      />

      {/* Admin Direct Upload Modal */}
      <AdminDirectUploadModal
        isOpen={showDirectUploadModal}
        onClose={() => setShowDirectUploadModal(false)}
        onSuccess={refresh}
      />

      {/* Context-Aware Permanent Deletion Confirmation Modal */}
      {itemToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">
                {itemToRemove.status === "flagged" || (itemToRemove.automatedRiskScore ?? 0) >= 70
                  ? "🚨"
                  : "⚠️"}
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {itemToRemove.status === "flagged" || (itemToRemove.automatedRiskScore ?? 0) >= 70
                  ? "Emergency Threat Purge"
                  : "Confirm Permanent Deletion (Author Takedown)"}
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {itemToRemove.status === "flagged" || (itemToRemove.automatedRiskScore ?? 0) >= 70 ? (
                <>
                  This link was deemed <strong className="text-red-600">malicious or dangerous</strong> by the automated threat scanner (Risk Score: {itemToRemove.automatedRiskScore}%). Are you sure you want to permanently erase this hazard from the system and database?
                </>
              ) : (
                <>
                  This fanwork is currently in quarantine (<strong>{itemToRemove.status}</strong>). Are you sure you want to permanently expunge &ldquo;<strong>{itemToRemove.title}</strong>&rdquo; per author takedown request? All records will be erased and this action cannot be undone.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="px-3.5 py-1.5 border border-border-light dark:border-border-dark rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold transition shadow-xs"
              >
                Permanently Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
