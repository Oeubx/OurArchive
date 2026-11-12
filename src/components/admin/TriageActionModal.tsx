"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { AdminActionType, AdminTriageFeedRecord } from "@/types/database";

interface TriageActionModalProps {
  isOpen: boolean;
  action: AdminActionType | null;
  item: AdminTriageFeedRecord | null;
  onClose: () => void;
  onSuccess: (updatedAction: AdminActionType, linkId: string) => void;
}

export function TriageActionModal({
  isOpen,
  action,
  item,
  onClose,
  onSuccess,
}: TriageActionModalProps) {
  const [reason, setReason] = useState("");
  const [hardDelete, setHardDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<{
    ownerEmail?: string | null;
    ownerName?: string | null;
    mailtoUrl?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setHardDelete(false);
      setError(null);
      setContactData(null);
    }
  }, [isOpen, action]);

  if (!isOpen || !action || !item || !mounted) return null;

  const actionTitles: Record<AdminActionType, string> = {
    VERIFY: "Re-scan & Verify Drive Link",
    APPROVE: "Approve & Publish Fanwork",
    REJECT: "Reject Fanwork Submission",
    HIDE: "Hide Fanwork from Public Search",
    UNHIDE: "Restore Fanwork Visibility",
    CONTACT: "Contact Submitter / Drive Owner",
    REMOVE: "Permanently Delete Fanwork Record",
  };

  const actionDescriptions: Record<AdminActionType, string> = {
    VERIFY:
      "Re-queries the Google Drive API to verify view-only permissions, checks Google Safe Browsing, and updates the automated risk score.",
    APPROVE:
      "Marks this fanwork as verified, awards the MANUAL_VERIFIED badge, and publishes it immediately to the public search index.",
    REJECT:
      "Marks this submission as rejected and hides it from the public directory. Documenting a reason is required for the audit log.",
    HIDE:
      "Toggles visibility off (is_hidden = true) without deleting data. Used for temporary review or preliminary takedown handling.",
    UNHIDE:
      "Restores visibility (is_hidden = false) so readers can find and access the work again in public search.",
    CONTACT:
      "Prepares direct communication with the Drive owner or submitter regarding formatting, permissions, or missing author metadata.",
    REMOVE:
      "Permanently deletes this fanwork from OurArchive. Soft-delete hides it from all listings while keeping audit logs, or hard-delete deletes all related database records.",
  };

  const buttonColors: Record<AdminActionType, string> = {
    VERIFY: "bg-blue-600 hover:bg-blue-700 text-white",
    APPROVE: "bg-emerald-600 hover:bg-emerald-700 text-white",
    REJECT: "bg-amber-600 hover:bg-amber-700 text-white",
    HIDE: "bg-gray-800 hover:bg-gray-900 text-white",
    UNHIDE: "bg-indigo-600 hover:bg-indigo-700 text-white",
    CONTACT: "bg-purple-600 hover:bg-purple-700 text-white",
    REMOVE: "bg-red-600 hover:bg-red-700 text-white",
  };

  const isReasonRequired = action === "REJECT" || action === "REMOVE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action || !item) return;

    if (isReasonRequired && !reason.trim()) {
      setError(`A reason is required to ${action.toLowerCase()} this submission.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId: item?.link_id,
          actionType: action,
          reason: reason.trim(),
          hardDelete,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action execution failed.");
      }

      if (action === "CONTACT" && data.contactInfo) {
        setContactData(data.contactInfo);
        onSuccess(action, item?.link_id || "");
        return;
      }

      onSuccess(action, item?.link_id || "");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing action.");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 text-xs">
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-sm">{actionTitles[action]}</span>
            <span className="block text-[11px] text-gray-400 font-mono">
              Link ID: {item.link_id.slice(0, 8)}...
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Work summary */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-1">
          <div className="font-bold text-gray-900 text-sm">
            {item.title || "Untitled Fanwork"}
          </div>
          <div className="text-gray-600">
            by <strong>{item.author_name || "Unknown Author"}</strong> • {item.fandom || "General"}
          </div>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-gray-500">
            <span>Score: {item.automated_risk_score ?? 0}/100</span>
            <span>•</span>
            <span className="uppercase font-semibold">{item.verification_status}</span>
            <span>•</span>
            <span>Drive ID: {item.google_file_id}</span>
          </div>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-gray-600 leading-relaxed">
            {actionDescriptions[action]}
          </p>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {action === "CONTACT" && contactData ? (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded space-y-2 text-purple-950">
              <div className="font-bold">Contact Details Resolved:</div>
              <p>
                Owner: <strong>{contactData.ownerName || "Anonymous"}</strong> ({contactData.ownerEmail || "No email available"})
              </p>
              {contactData.mailtoUrl ? (
                <a
                  href={contactData.mailtoUrl}
                  className="inline-block px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition"
                >
                  ✉️ Open Mail Client with Pre-filled Template
                </a>
              ) : (
                <p className="text-gray-500 italic">No public email found in Google Drive metadata.</p>
              )}
            </div>
          ) : (
            <>
              {/* Reason / Notes Input */}
              <div className="space-y-1">
                <label className="block font-medium text-gray-700">
                  Audit Reason / Notes {isReasonRequired && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isReasonRequired
                      ? "Describe reason for rejection or removal for the audit trail..."
                      : "Optional notes for the immutable administrative log..."
                  }
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-800 text-xs"
                />
              </div>

              {/* Hard delete option for REMOVE */}
              {action === "REMOVE" && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-red-900">
                  <input
                    type="checkbox"
                    id="hardDelete"
                    checked={hardDelete}
                    onChange={(e) => setHardDelete(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <label htmlFor="hardDelete" className="text-[11px] leading-tight cursor-pointer">
                    <strong>Permanent Database Delete (Hard Delete):</strong> Delete all related database rows completely instead of hiding them.
                  </label>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition font-medium"
            >
              Cancel
            </button>
            {(!contactData || action !== "CONTACT") && (
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-1.5 rounded font-semibold transition ${buttonColors[action]} disabled:opacity-50`}
              >
                {loading ? "Executing..." : `Confirm ${action}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
