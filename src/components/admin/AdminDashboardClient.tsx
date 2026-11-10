"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
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
import { getAllAuditRecords, exportAuditToCsv } from "@/lib/auditService";
import { VerifierRequestsModal } from "./VerifierRequestsModal";
import { AdminDirectUploadModal } from "./AdminDirectUploadModal";
import { AuditHistoryModal } from "./AuditHistoryModal";
import { LinkInspectionModal } from "@/components/manage/LinkInspectionModal";
import { AdminTakedownContainer } from "./AdminTakedownContainer";

interface AdminDashboardClientProps {
  adminEmail: string;
}

function ActionSpinner() {
  return (
    <svg className="animate-spin -ml-0.5 mr-1 h-2.5 w-2.5 inline-block text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
  );
}

export function AdminDashboardClient({ adminEmail }: AdminDashboardClientProps) {
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [role, setRole] = useState<UserRole>("admin");
  const [adminDisplayName, setAdminDisplayName] = useState<string>(
    adminEmail.split("@")[0] || "admin"
  );
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
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const [showVerifierRequestsModal, setShowVerifierRequestsModal] = useState(false);
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);
  const [inspectingLink, setInspectingLink] = useState<DriveLink | null>(null);
  const [itemToRemove, setItemToRemove] = useState<DriveLink | null>(null);
  const [auditLink, setAuditLink] = useState<{ id: string; title: string } | null>(null);

  async function handleTriageAction(actionKey: string, actionFn: () => Promise<unknown> | unknown) {
    if (processingActionId) return;
    setProcessingActionId(actionKey);
    try {
      await actionFn();
    } finally {
      setProcessingActionId(null);
    }
  }

  function refresh() {
    setRole(getCurrentUserRole());
    setLinks(getAllCommunityLinks());
    setMetrics(getArchiveMetrics());
  }

  useEffect(() => {
    refresh();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "admin";
        setAdminDisplayName(name);
      }
    });

    const unsubscribe = subscribeToRbacUpdates(() => {
      refresh();
    });
    return unsubscribe;
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Sorting: latest uploaded that is not approved at the top
  const sortedLinks = [...links].sort((a, b) => {
    const aUnapproved = a.status !== "approved";
    const bUnapproved = b.status !== "approved";
    if (aUnapproved && !bUnapproved) return -1;
    if (!aUnapproved && bUnapproved) return 1;
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  const filteredLinks = sortedLinks.filter((item) => {
    if (filter === "all") return true;
    if (filter === "pending") return item.status === "under_verification";
    if (filter === "approved") return item.status === "approved";
    if (filter === "hidden") return item.status === "hidden";
    if (filter === "flagged") return item.status === "flagged" || item.automatedRiskScore >= 70;
    if (filter === "rejected") return item.status === "rejected";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const displayedLinks = filteredLinks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleConfirmRemove() {
    if (!itemToRemove) return;
    removeLink(itemToRemove.id);
    setItemToRemove(null);
  }

  function handleExportAllAudit() {
    const allRecords = getAllAuditRecords();
    exportAuditToCsv(allRecords, "ourarchive_system_audit_all");
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportAllAudit}
            className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition shadow-2xs flex items-center gap-1.5"
            title="Export all system audit logs including deleted tombstones to CSV"
          >
            <span>📥</span> Export Audit Log (CSV)
          </button>
          <button
            type="button"
            onClick={() => setShowDirectUploadModal(true)}
            className="px-3.5 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1.5"
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
            In review / triage queue
          </span>
        </div>

        {/* Verifier Role Requests */}
        <div
          onClick={() => setShowVerifierRequestsModal(true)}
          className="bg-surface-light dark:bg-surface-dark border border-purple-200 dark:border-purple-900/60 p-4 rounded-xl shadow-xs cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-purple-800 dark:text-purple-400 text-[11px] block uppercase font-bold tracking-wider">
              Verifier Applications
            </span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-semibold group-hover:bg-purple-600 group-hover:text-white transition">
              Review &rarr;
            </span>
          </div>
          <span className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 mt-1 block">
            {metrics.pendingApplicationsCount}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
            Contributors requesting verifier role
          </span>
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

      {/* Admin Takedown & Multi-Fic Cloud Drive Suppression Desk */}
      <AdminTakedownContainer links={links} onRefresh={refresh} />

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

          {/* Categorized Filter Tabs (Native scrollbar hidden) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                onClick={() => {
                  setFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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

        {/* Triage Container: Dual Responsive Layout (Mobile Cards vs Desktop Table) */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
          {displayedLinks.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-500 dark:text-gray-400">
              No submissions found matching the &ldquo;{filter}&rdquo; filter.
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (< md): Touch-Friendly Accessible Card Stack */}
              <div className="block md:hidden divide-y divide-border-light dark:divide-border-dark">
                {displayedLinks.map((item) => {
                  const isMaliciousThreat =
                    item.status === "flagged" || (item.automatedRiskScore ?? 0) >= 70;
                  const isQuarantined = item.status === "hidden" || item.status === "rejected";
                  const canDelete = isQuarantined || isMaliciousThreat;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setInspectingLink(item)}
                      className="p-4 space-y-3 hover:bg-subtle-light dark:hover:bg-subtle-dark/40 cursor-pointer transition text-xs"
                    >
                      {/* Card Header: Title & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-brand-trunk transition">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            by {item.authorName} &bull; {item.fandom}
                          </p>
                          {item.verificationBadge && (
                            <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              {item.verificationBadge}
                            </span>
                          )}
                        </div>
                        <div>
                          {item.status === "approved" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 uppercase">
                              Approved
                            </span>
                          )}
                          {item.status === "under_verification" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 uppercase">
                              Under Review
                            </span>
                          )}
                          {item.status === "hidden" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 uppercase">
                              Hidden
                            </span>
                          )}
                          {item.status === "rejected" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 uppercase">
                              Rejected
                            </span>
                          )}
                          {item.status === "flagged" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase animate-pulse">
                              Threat Flagged
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Masked Link & Submitter Row */}
                      <div className="bg-canvas-light/60 dark:bg-canvas-dark/60 p-2.5 rounded-lg border border-border-light dark:border-border-dark space-y-1 font-mono text-[11px]">
                        <div className="truncate text-gray-600 dark:text-gray-300">
                          {item.maskedDriveUrl}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">
                          Submitted by <strong className="text-gray-700 dark:text-gray-300">@{item.uploadedBy}</strong> ({item.uploadedByRole})
                        </div>
                      </div>

                      {/* Touch-Friendly Action Buttons */}
                      <div
                        className="flex flex-wrap items-center gap-1.5 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setInspectingLink(item)}
                          className="px-2.5 py-1 bg-subtle-light dark:bg-subtle-dark hover:bg-brand-trunk hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition cursor-pointer"
                        >
                          🔍 Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditLink({ id: item.id, title: item.title })}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white rounded border border-purple-200 dark:border-purple-800 text-[11px] font-semibold transition cursor-pointer"
                        >
                          📜 Audit
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingActionId)}
                          onClick={() => handleTriageAction(`${item.id}-verify`, () => verifyLink(item.id, adminDisplayName))}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                        >
                          {processingActionId === `${item.id}-verify` && <ActionSpinner />}
                          Verify
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingActionId)}
                          onClick={() => handleTriageAction(`${item.id}-approve`, () => approveLink(item.id, adminDisplayName, item.isPriorVerified))}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                        >
                          {processingActionId === `${item.id}-approve` && <ActionSpinner />}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingActionId)}
                          onClick={() => handleTriageAction(`${item.id}-reject`, () => rejectLink(item.id, adminDisplayName))}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white rounded border border-amber-200 dark:border-amber-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                        >
                          {processingActionId === `${item.id}-reject` && <ActionSpinner />}
                          Reject
                        </button>
                        {item.status === "hidden" ? (
                          <button
                            type="button"
                            disabled={Boolean(processingActionId)}
                            onClick={() => handleTriageAction(`${item.id}-unhide`, () => unhideLink(item.id, adminDisplayName))}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                          >
                            {processingActionId === `${item.id}-unhide` && <ActionSpinner />}
                            Unhide
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(processingActionId)}
                            onClick={() => handleTriageAction(`${item.id}-hide`, () => hideLink(item.id, adminDisplayName))}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                          >
                            {processingActionId === `${item.id}-hide` && <ActionSpinner />}
                            Hide
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setItemToRemove(item)}
                            className="px-2.5 py-1 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 hover:bg-red-600 hover:text-white transition cursor-pointer"
                          >
                            {isMaliciousThreat ? "🚨 Purge" : "🗑️ Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW (md:block): Full Structured Data Table */}
              <div className="hidden md:block overflow-x-auto">
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
                    {displayedLinks.map((item) => {
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
                            <div className="font-bold text-gray-900 dark:text-gray-100 hover:text-brand-trunk transition">
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
                                  {item.verificationBadge}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Masked Link & Privacy (Protected against mass scraping) */}
                          <td className="py-3 px-4 max-w-[200px] truncate font-mono text-gray-600 dark:text-gray-300">
                            <span title={item.maskedDriveUrl} className="hover:underline">
                              {item.maskedDriveUrl}
                            </span>
                          </td>

                          {/* Submitter */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              @{item.uploadedBy}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                              Role: {item.uploadedByRole}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {item.status === "approved" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase">
                                Approved
                              </span>
                            )}
                            {item.status === "under_verification" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
                                Under Review
                              </span>
                            )}
                            {item.status === "hidden" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 uppercase">
                                Hidden (Quarantine)
                              </span>
                            )}
                            {item.status === "rejected" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 uppercase">
                                Rejected
                              </span>
                            )}
                            {item.status === "flagged" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase animate-pulse">
                                Threat Flagged
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Inspect */}
                              <button
                                type="button"
                                onClick={() => setInspectingLink(item)}
                                title="Inspect metadata, run scanner, and triage"
                                className="px-2 py-1 bg-subtle-light dark:bg-subtle-dark hover:bg-brand-trunk hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition"
                              >
                                🔍 Inspect
                              </button>

                              {/* AUDIT HISTORY */}
                              <button
                                type="button"
                                onClick={() => setAuditLink({ id: item.id, title: item.title })}
                                title="View lifecycle audit history and export CSV/PDF report"
                                className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white rounded border border-purple-200 dark:border-purple-800 text-[11px] font-semibold transition"
                              >
                                📜 Audit
                              </button>

                              {/* VERIFY */}
                              <button
                                type="button"
                                disabled={Boolean(processingActionId)}
                                onClick={() => handleTriageAction(`${item.id}-verify`, () => verifyLink(item.id, adminDisplayName))}
                                title="Verify and certify link"
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white rounded border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                              >
                                {processingActionId === `${item.id}-verify` && <ActionSpinner />}
                                Verify
                              </button>

                              {/* APPROVE */}
                              <button
                                type="button"
                                disabled={Boolean(processingActionId)}
                                onClick={() => handleTriageAction(`${item.id}-approve`, () => approveLink(item.id, adminDisplayName, item.isPriorVerified))}
                                title="Approve and publish"
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                              >
                                {processingActionId === `${item.id}-approve` && <ActionSpinner />}
                                Approve
                              </button>

                              {/* REJECT */}
                              <button
                                type="button"
                                disabled={Boolean(processingActionId)}
                                onClick={() => handleTriageAction(`${item.id}-reject`, () => rejectLink(item.id, adminDisplayName))}
                                title="Reject submission"
                                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white rounded border border-amber-200 dark:border-amber-800 text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                              >
                                {processingActionId === `${item.id}-reject` && <ActionSpinner />}
                                Reject
                              </button>

                              {/* HIDE / UNHIDE */}
                              {item.status === "hidden" ? (
                                <button
                                  type="button"
                                  disabled={Boolean(processingActionId)}
                                  onClick={() => handleTriageAction(`${item.id}-unhide`, () => unhideLink(item.id, adminDisplayName))}
                                  title="Restore visibility"
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                                >
                                  {processingActionId === `${item.id}-unhide` && <ActionSpinner />}
                                  Unhide
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={Boolean(processingActionId)}
                                  onClick={() => handleTriageAction(`${item.id}-hide`, () => hideLink(item.id, adminDisplayName))}
                                  title="Quarantine work for author takedown checking"
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-700 hover:text-white rounded border border-border-light dark:border-border-dark text-[11px] font-semibold transition disabled:opacity-40 cursor-pointer"
                                >
                                  {processingActionId === `${item.id}-hide` && <ActionSpinner />}
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
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar (Maximum 5 Data Rows) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-border-light dark:border-border-dark bg-subtle-light/40 dark:bg-subtle-dark/40 text-xs">
                  <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredLinks.length)} of {filteredLinks.length} submissions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      &larr; Prev
                    </button>
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-[11px]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark disabled:opacity-40 transition font-medium text-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Link Inspection Modal */}
      <LinkInspectionModal
        link={inspectingLink}
        isOpen={!!inspectingLink}
        isAdmin={true}
        onClose={() => setInspectingLink(null)}
        onApprove={(id, isPriorVerified) => {
          approveLink(id, adminDisplayName, isPriorVerified);
        }}
        onReject={(id) => {
          rejectLink(id, adminDisplayName);
        }}
        onHide={(id) => {
          hideLink(id, adminDisplayName);
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
        adminDisplayName={adminDisplayName}
        onClose={() => setShowDirectUploadModal(false)}
        onSuccess={refresh}
      />

      {/* Audit History & CSV / PDF Export Modal */}
      <AuditHistoryModal
        linkId={auditLink?.id || null}
        workTitle={auditLink?.title}
        isOpen={!!auditLink}
        onClose={() => setAuditLink(null)}
      />

      {/* Context-Aware Permanent Deletion Confirmation Modal */}
      {itemToRemove && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
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
                  This link was deemed <strong className="text-red-600">malicious or dangerous</strong> by the automated threat scanner (Risk Score: {itemToRemove.automatedRiskScore}%). Are you sure you want to permanently erase this hazard from the system and database? A permanent tombstone audit log will be retained.
                </>
              ) : (
                <>
                  This fanwork is currently in quarantine (<strong>{itemToRemove.status}</strong>). Are you sure you want to permanently expunge &ldquo;<strong>{itemToRemove.title}</strong>&rdquo; per author takedown request? All public records will be erased and a permanent immutable tombstone will be recorded in the audit history.
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
        </div>,
        document.body
      )}
    </div>
  );
}
