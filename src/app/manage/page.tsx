"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DriveLink, UserRole } from "@/lib/types";
import {
  getAllCommunityLinks,
  getArchiveMetrics,
  approveLink,
  rejectLink,
  hideLink,
  subscribeToRbacUpdates,
} from "@/lib/rbacService";
import { LinkInspectionModal } from "@/components/manage/LinkInspectionModal";
import { AdminTakedownContainer } from "@/components/admin/AdminTakedownContainer";
import { createClient } from "@/lib/supabase/client";

export default function VerifierManagePage() {
  const [role, setRole] = useState<UserRole | "guest">("guest");
  const [loading, setLoading] = useState(true);
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
    setLinks(getAllCommunityLinks());
    setMetrics(getArchiveMetrics());
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const userMetaRole = (user.app_metadata as Record<string, unknown> | undefined)?.role as UserRole | undefined;
        setRole(userMetaRole || "contributor");
      } else {
        setRole("guest");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        const userMetaRole = (user.app_metadata as Record<string, unknown> | undefined)?.role as UserRole | undefined;
        setRole(userMetaRole || "contributor");
      } else {
        setRole("guest");
      }
    });

    refreshState();
    const unsubscribe = subscribeToRbacUpdates(() => {
      refreshState();
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, []);

  // Filtered links
  const filteredLinks = links.filter((item) => {
    if (selectedStatusFilter === "all") return true;
    return item.status === selectedStatusFilter;
  });

  const isAuthorized = role === "verifier" || role === "admin";

  if (loading) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-3">
        <div className="h-8 bg-subtle-light dark:bg-subtle-dark animate-pulse rounded-lg w-1/2 mx-auto" />
        <div className="h-4 bg-subtle-light dark:bg-subtle-dark animate-pulse rounded w-3/4 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Breadcrumb & Role Bar */}
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

        {/* Role Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Role:</span>
          <span
            className={`px-2.5 py-0.5 rounded font-mono font-bold text-[11px] uppercase border ${
              role === "admin"
                ? "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                : role === "verifier"
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            }`}
          >
            {role}
          </span>
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
              className="px-4 py-2 bg-brand-trunk text-white text-xs font-semibold rounded-lg hover:bg-brand-bark transition shadow-xs"
            >
              Apply to Become a Verifier
            </Link>
            <Link
              href="/"
              className="px-4 py-2 border border-border-light dark:border-border-dark text-xs font-semibold rounded-lg hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
            >
              Back to Home
            </Link>
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

            {/* Hidden / Quarantined Links Counter */}
            <div className="bg-surface-light dark:bg-surface-dark border border-red-200 dark:border-red-900/60 p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-red-800 dark:text-red-400 block uppercase tracking-wider">
                  Hidden / Quarantined
                </span>
                <span className="text-3xl font-extrabold text-red-700 dark:text-red-400 mt-1 block">
                  {metrics.hiddenCount}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                  Suppressed from public search
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-xl text-brand-trunk">
                🔴
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
              <div className="w-10 h-10 rounded-full bg-subtle-light dark:bg-subtle-dark flex items-center justify-center text-xl text-brand-trunk">
                📚
              </div>
            </div>
          </div>

          {/* Admin Takedown Container */}
          {role === "admin" && (
            <AdminTakedownContainer links={links} onRefresh={refreshState} />
          )}

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
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedStatusFilter === tab.id
                        ? "bg-brand-trunk text-white shadow-2xs"
                        : "bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submission Records Table */}
            <div className="border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden shadow-xs">
              {filteredLinks.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                  <div className="text-2xl">📋</div>
                  <div className="font-semibold text-gray-700 dark:text-gray-300">No submissions in this filter</div>
                  <p>Check other tabs or submit a new drive link from the contribute portal.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas-light dark:bg-canvas-dark text-gray-600 dark:text-gray-400 border-b border-border-light dark:border-border-dark select-none">
                      <tr>
                        <th className="p-3">Work Details</th>
                        <th className="p-3">Drive Uploader</th>
                        <th className="p-3">Safety Risk</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Triage Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                      {filteredLinks.map((link) => (
                        <tr
                          key={link.id}
                          className="hover:bg-subtle-light dark:hover:bg-subtle-dark transition group"
                        >
                          <td className="p-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100 hover:text-brand-trunk dark:hover:text-brand-light transition">
                              {link.title}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              by {link.authorName} &bull; {link.fandom} &bull; {link.wordCount.toLocaleString()} words
                            </div>
                          </td>
                          <td className="p-3 text-gray-700 dark:text-gray-300">
                            <div>{link.driveOwnerName || "Anonymous Contributor"}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{link.uploadedBy}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                link.automatedRiskScore === 0
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                  : link.automatedRiskScore < 70
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                                  : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
                              }`}
                            >
                              Risk Score: {link.automatedRiskScore}/100
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                                link.status === "approved"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                  : link.status === "under_verification"
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                  : link.status === "hidden"
                                  ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                                  : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                              }`}
                            >
                              {link.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingLink(link)}
                                className="px-2.5 py-1 bg-subtle-light dark:bg-subtle-dark hover:bg-brand-trunk hover:text-white rounded text-xs font-semibold border border-border-light dark:border-border-dark transition inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>🔍</span> Inspect
                              </button>

                              {link.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    approveLink(link.id);
                                    refreshState();
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition shadow-2xs"
                                  title="Approve and mark verified"
                                >
                                  Approve
                                </button>
                              )}

                              {link.status !== "hidden" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    hideLink(link.id);
                                    refreshState();
                                  }}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold transition shadow-2xs"
                                  title="Hide work from public directory"
                                >
                                  Hide
                                </button>
                              )}

                              {link.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    rejectLink(link.id);
                                    refreshState();
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition shadow-2xs"
                                  title="Reject submission"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Inspect Link Modal */}
      <LinkInspectionModal
        link={inspectingLink}
        isOpen={Boolean(inspectingLink)}
        onClose={() => setInspectingLink(null)}
        onApprove={(id) => {
          approveLink(id);
          refreshState();
          setInspectingLink(null);
        }}
        onReject={(id) => {
          rejectLink(id);
          refreshState();
          setInspectingLink(null);
        }}
        onHide={(id) => {
          hideLink(id);
          refreshState();
          setInspectingLink(null);
        }}
      />
    </div>
  );
}
