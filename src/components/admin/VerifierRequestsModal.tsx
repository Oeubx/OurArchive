"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { VerifierApplication } from "@/lib/types";
import {
  getAllVerifierApplications,
  approveVerifierApplication,
  declineVerifierApplication,
  subscribeToRbacUpdates,
} from "@/lib/rbacService";

interface UserProfileRecord {
  id: string;
  display_name: string;
  role: "contributor" | "verifier" | "admin" | "user";
  is_banned: boolean;
  submission_count: number;
  created_at: string;
}

interface PendingRoleChange {
  userId: string;
  userName: string;
  currentRole: string;
  targetRole: "contributor" | "verifier" | "admin";
}

interface VerifierRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerifierRequestsModal({
  isOpen,
  onClose,
}: VerifierRequestsModalProps) {
  const [applications, setApplications] = useState<VerifierApplication[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "users">("pending");
  const [mounted, setMounted] = useState(false);

  // User Role Management state
  const [users, setUsers] = useState<UserProfileRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);
  const [roleChangeFeedback, setRoleChangeFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [executingRoleChange, setExecutingRoleChange] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function refresh() {
    setApplications(getAllVerifierApplications());
  }

  const loadUserDirectory = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users/role", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch (err) {
      console.error("Could not load user directory:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToRbacUpdates(() => {
      refresh();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeTab === "users" && isOpen) {
      loadUserDirectory();
    }
  }, [activeTab, isOpen, loadUserDirectory]);

  if (!isOpen || !mounted) return null;

  const pendingApps = applications.filter((app) => app.status === "pending");
  const displayedApps = activeTab === "pending" ? pendingApps : applications;

  async function handleConfirmRoleChange() {
    if (!pendingRoleChange) return;
    setExecutingRoleChange(true);
    setRoleChangeFeedback(null);

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: pendingRoleChange.userId,
          newRole: pendingRoleChange.targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user role.");
      }

      setRoleChangeFeedback({
        type: "success",
        text: data.message || `Updated role to ${pendingRoleChange.targetRole}.`,
      });
      setPendingRoleChange(null);
      await loadUserDirectory();
    } catch (err: unknown) {
      setRoleChangeFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update role.",
      });
    } finally {
      setExecutingRoleChange(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
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
                Verifier Applications &amp; User Role Access
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Review applicant qualifications or manage authenticated user role access.
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
                ? "border-brand-trunk text-brand-trunk dark:text-brand-light"
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
                ? "border-brand-trunk text-brand-trunk dark:text-brand-light"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            All Applications ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === "users"
                ? "border-brand-trunk text-brand-trunk dark:text-brand-light"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            User Directory ({users.length > 0 ? users.length : "Directory"})
          </button>
        </div>

        {/* Status Feedback */}
        {roleChangeFeedback && (
          <div
            className={`mx-5 mt-3 p-2.5 rounded-lg border text-xs ${
              roleChangeFeedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {roleChangeFeedback.text}
          </div>
        )}

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === "users" ? (
            loadingUsers ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                Loading registered user profiles...
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No user profiles logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => {
                  const normalizedRole = u.role === "user" ? "contributor" : u.role;
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span>{u.display_name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              normalizedRole === "admin"
                                ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800"
                                : normalizedRole === "verifier"
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                                : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                            }`}
                          >
                            {normalizedRole}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {u.submission_count} submission{u.submission_count === 1 ? "" : "s"} • Joined{" "}
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Role Switching Selector */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <span className="text-[11px] text-gray-400">Change Role:</span>
                        <select
                          value={normalizedRole}
                          onChange={(e) => {
                            const nextRole = e.target.value as "contributor" | "verifier" | "admin";
                            if (nextRole !== normalizedRole) {
                              setPendingRoleChange({
                                userId: u.id,
                                userName: u.display_name,
                                currentRole: normalizedRole,
                                targetRole: nextRole,
                              });
                            }
                          }}
                          className="px-2.5 py-1 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 text-xs font-semibold outline-hidden focus:ring-1 focus:ring-brand-trunk"
                        >
                          <option value="contributor">Contributor</option>
                          <option value="verifier">Verifier</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : displayedApps.length === 0 ? (
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
                    Trust &amp; Safety Pledge:
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
                      className="px-3 py-1.5 rounded-md border border-red-300 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition cursor-pointer"
                    >
                      ❌ Decline Application
                    </button>
                    <button
                      type="button"
                      onClick={() => approveVerifierApplication(app.id)}
                      className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
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
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* CONFIRMATION / CANCELLATION VALIDATION MODAL */}
      {pendingRoleChange && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-surface-light dark:bg-surface-dark border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Confirm Role Access Change
              </h4>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to change <strong>{pendingRoleChange.userName}</strong>&apos;s role access from{" "}
              <span className="font-bold uppercase text-brand-trunk">{pendingRoleChange.currentRole}</span> to{" "}
              <span className="font-bold uppercase text-brand-bark dark:text-brand-light">{pendingRoleChange.targetRole}</span>?
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-200">
              {pendingRoleChange.targetRole === "admin"
                ? "Granting Administrator access enables full 6-action triage, takedowns, and user role management."
                : pendingRoleChange.targetRole === "verifier"
                ? "Granting Verifier access allows inspecting view-only Drive links and running threat scans."
                : "Setting to Contributor restricts access to standard fanwork submission and library reading."}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                disabled={executingRoleChange}
                className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={executingRoleChange}
                className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {executingRoleChange ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Updating...</span>
                  </>
                ) : (
                  "Confirm Role Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

