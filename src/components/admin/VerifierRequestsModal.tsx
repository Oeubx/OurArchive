"use client";

import React, { useState, useEffect } from "react";
import { VerifierApplication } from "@/lib/types";
import {
  getAllVerifierApplications,
  approveVerifierApplication,
  declineVerifierApplication,
  subscribeToRbacUpdates,
} from "@/lib/rbacService";

interface VerifierRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerifierRequestsModal({
  isOpen,
  onClose,
}: VerifierRequestsModalProps) {
  const [applications, setApplications] = useState<VerifierApplication[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  function refresh() {
    setApplications(getAllVerifierApplications());
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToRbacUpdates(() => {
      refresh();
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const pendingApps = applications.filter((app) => app.status === "pending");
  const displayedApps = activeTab === "pending" ? pendingApps : applications;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verifier-requests-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <div>
              <h3
                id="verifier-requests-title"
                className="text-base font-bold text-gray-900 dark:text-gray-100"
              >
                Verifier Applications ({pendingApps.length} Pending)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Review applicant qualifications and trust pledges before granting moderation rights.
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-border-light dark:border-border-dark text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === "pending"
                ? "border-ao3-red text-ao3-red dark:text-ao3-lightred"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            Pending Requests ({pendingApps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === "all"
                ? "border-ao3-red text-ao3-red dark:text-ao3-lightred"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            All History ({applications.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {displayedApps.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
              {activeTab === "pending"
                ? "No pending verifier requests at this time."
                : "No verifier application history."}
            </div>
          ) : (
            displayedApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border-light dark:border-border-dark pb-2">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {app.userName}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      ({app.userEmail})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">
                      Submitted {new Date(app.submittedAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : app.status === "declined"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block text-[11px]">
                    Why they want to be a verifier:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 italic bg-surface-light dark:bg-surface-dark p-2.5 rounded-lg border border-border-light dark:border-border-dark">
                    &ldquo;{app.reason}&rdquo;
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block text-[11px]">
                    Trust & Safety Pledge:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 bg-surface-light dark:bg-surface-dark p-2.5 rounded-lg border border-border-light dark:border-border-dark">
                    {app.trustPledge}
                  </p>
                </div>

                {/* Actions for pending apps */}
                {app.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => declineVerifierApplication(app.id)}
                      className="px-3 py-1.5 rounded-md border border-red-300 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition"
                    >
                      ❌ Decline Application
                    </button>
                    <button
                      type="button"
                      onClick={() => approveVerifierApplication(app.id)}
                      className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                      ✅ Approve as Verifier
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
