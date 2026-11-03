"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DriveLink, LinkStatus, UserRole } from "@/lib/types";
import {
  getAllCommunityLinks,
  getArchiveMetrics,
  getCurrentUserRole,
  setSimulatedRole,
  approveLink,
  rejectLink,
  hideLink,
  subscribeToRbacUpdates,
} from "@/lib/rbacService";
import { LinkInspectionModal } from "@/components/manage/LinkInspectionModal";

export default function VerifierManagePage() {
  const [role, setRole] = useState<UserRole>("contributor");
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [metrics, setMetrics] = useState({
    approvedCount: 0,
    underVerificationCount: 0,
    hiddenCount: 0,
    rejectedCount: 0,
    pendingApplicationsCount: 0,
    totalLinksCount: 0,
  });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [inspectingLink, setInspectingLink] = useState<DriveLink | null>(null);

  function refreshState() {
    const currentRole = getCurrentUserRole();
    setRole(currentRole);
    setLinks(getAllCommunityLinks());
    setMetrics(getArchiveMetrics());
  }

  useEffect(() => {
    refreshState();
    const unsubscribe = subscribeToRbacUpdates(() => {
      refreshState();
    });
    return unsubscribe;
  }, []);

  // Filtered links
  const filteredLinks = links.filter((item) => {
    if (selectedStatusFilter === "all") return true;
    return item.status === selectedStatusFilter;
  });

  const isAuthorized = role === "verifier" || role === "admin";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Breadcrumb & Role Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">Verifier Workspace</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-1 flex items-center gap-2">
            <span>🛡️</span> Community Moderation & Verification
          </h1>
        </div>

        {/* Role Status and Quick Dev Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Current Role:</span>
          <span
            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] uppercase border ${
              role === "admin"
                ? "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : role === "verifier"
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            }`}
          >
            {role}
          </span>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setSimulatedRole("verifier")}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                role === "verifier"
                  ? "bg-ao3-red text-white border-ao3-red"
                  : "bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
              }`}
            >
              Simulate Verifier
            </button>
            <button
              type="button"
              onClick={() => setSimulatedRole("admin")}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                role === "admin"
                  ? "bg-amber-500 text-black border-amber-500 font-bold"
                  : "bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
              }`}
            >
              Simulate Admin
            </button>
          </div>
        </div>
      </div>

      {/* ACCESS GATE: If not authorized, show gate */}
      {!isAuthorized ? (
        <div className="p-8 text-center bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-2xl text-amber-600 dark:text-amber-400">
            🔒
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Verifier Access Restricted
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              The `/manage` portal is exclusively restricted to community Verifiers and Administrators.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/contribute"
              className="px-4 py-2 bg-ao3-red text-white text-xs font-semibold rounded-lg hover:bg-ao3-darkred transition shadow-xs"
            >
              Apply to Become a Verifier
            </Link>
            <button
              type="button"
              onClick={() => setSimulatedRole("verifier")}
              className="px-4 py-2 border border-border-light dark:border-border-dark text-xs font-semibold rounded-lg hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
            >
              Switch to Verifier Role
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Approved Links Counter */}
            <div className="bg-surface-light dark:bg-surface-dark border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider">
                  Approved Links
                </span>
                <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {metrics.approvedCount}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Publicly readable in Archive
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-xl text-emerald-600">
                🟢
              </div>
            </div>

            {/* Under Verification Links Counter */}
            <div className="bg-surface-light dark:bg-surface-dark border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block uppercase tracking-wider">
                  Under Verification
                </span>
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                  {metrics.underVerificationCount}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Awaiting link inspection
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-xl text-amber-600">
                🟡
              </div>
            </div>

            {/* Hidden Links Counter */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block uppercase tracking-wider">
                  Hidden / Quarantine
                </span>
                <span className="text-3xl font-extrabold text-gray-700 dark:text-gray-300 mt-1 block">
                  {metrics.hiddenCount}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Temporarily delisted
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-subtle-light dark:bg-subtle-dark flex items-center justify-center text-xl text-gray-500">
                👁️
              </div>
            </div>

            {/* Total Ingested Counter */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block uppercase tracking-wider">
                  Total Submissions
                </span>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1 block">
                  {metrics.totalLinksCount}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Combined community queue
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-subtle-light dark:bg-subtle-dark flex items-center justify-center text-xl text-ao3-red">
                📚
              </div>
            </div>
          </div>

          {/* Main Community Submissions Triage Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Community Submissions Review Queue
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click on any submission row or the Inspect button to review metadata and judge link safety.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: `All (${links.length})` },
                  { id: "under_verification", label: `Pending (${metrics.underVerificationCount})` },
                  { id: "approved", label: `Approved (${metrics.approvedCount})` },
                  { id: "hidden", label: `Hidden (${metrics.hiddenCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                      selectedStatusFilter === tab.id
                        ? "bg-ao3-red text-white shadow-2xs"
                        : "bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-300 border border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Work & Author</th>
                      <th className="py-3 px-4">Drive Link (Masked)</th>
                      <th className="py-3 px-4">Submitted By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {filteredLinks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                          No submissions found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLinks.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setInspectingLink(item)}
                          className="hover:bg-subtle-light dark:hover:bg-subtle-dark/60 cursor-pointer transition"
                        >
                          {/* Work & Author */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-gray-900 dark:text-gray-100 hover:text-ao3-red dark:hover:text-ao3-lightred transition">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span>by {item.authorName}</span>
                              <span>•</span>
                              <span>{item.fandom}</span>
                            </div>
                          </td>

                          {/* Drive Link Masked */}
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                            <span className="bg-canvas-light dark:bg-canvas-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">
                              {item.maskedDriveUrl}
                            </span>
                          </td>

                          {/* Submitted By */}
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span>🟢</span> Approved
                              </span>
                            ) : item.status === "under_verification" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span>🟡</span> Under Verification
                              </span>
                            ) : item.status === "hidden" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                                <span>👁️</span> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <span>❌</span> Rejected
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingLink(item);
                              }}
                              className="px-2.5 py-1 bg-subtle-light dark:bg-subtle-dark hover:bg-ao3-red hover:text-white rounded text-xs font-semibold border border-border-light dark:border-border-dark transition inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>👁️</span> Inspect
                            </button>
                          </td>
                        </tr>
                      ))
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
            onClose={() => setInspectingLink(null)}
            onApprove={(id) => {
              approveLink(id, role === "admin" ? "biboy_admin" : "community_verifier");
            }}
            onReject={(id) => {
              rejectLink(id, role === "admin" ? "biboy_admin" : "community_verifier");
            }}
            onHide={(id) => {
              hideLink(id);
            }}
          />
        </>
      )}
    </div>
  );
}
