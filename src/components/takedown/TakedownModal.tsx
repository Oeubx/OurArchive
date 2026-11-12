"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DirectTakedownEmailModal } from "./DirectTakedownEmailModal";

interface TakedownModalProps {
  isOpen: boolean;
  workId?: string | null;
  workTitle?: string | null;
  userEmail?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TakedownModal({
  isOpen,
  workId,
  workTitle,
  userEmail,
  onClose,
  onSuccess,
}: TakedownModalProps) {
  const [targetQuery, setTargetQuery] = useState("");
  const [role, setRole] = useState("author");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [ownershipProof, setOwnershipProof] = useState("");
  const [reason, setReason] = useState("");
  const [preference, setPreference] = useState<"permanent" | "hide">("permanent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTargetQuery(workTitle || workId || "");
      setRole("author");
      setRequesterEmail(userEmail || "");
      setOwnershipProof("");
      setReason("");
      setPreference("permanent");
      setError(null);
      setSubmitted(false);
    }
  }, [isOpen, workId, workTitle, userEmail]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetQuery.trim() && !workId) {
      setError("Please specify the Work Title, File Name, or Reference ID.");
      return;
    }
    if (!ownershipProof.trim()) {
      setError("Please provide proof of ownership or credibility details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: workId || null,
          targetQuery: targetQuery.trim(),
          role,
          requesterEmail: requesterEmail.trim() || null,
          ownershipProof: ownershipProof.trim(),
          reason: reason.trim(),
          preference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit takedown request.");
      }

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark text-xs text-gray-800 dark:text-gray-200">
            {/* Header */}
            <div className="bg-brand-trunk text-white px-5 py-3 flex items-center justify-between sticky top-0 z-10">
              <span className="text-sm sm:text-base font-bold">
                🚨 Immediate Takedown &amp; Removal Request
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white text-lg font-bold transition"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {submitted ? (
              <div className="p-6 space-y-4 text-center">
                <div className="text-4xl">✅</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Takedown Request Logged in Supabase
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
                  Your request and ownership details have been saved to our Takedown Queue. Matched works are <strong>hidden right away</strong> from public search and readers pending final removal review.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-900 dark:bg-zinc-800 text-white rounded-lg font-medium transition hover:bg-gray-800 dark:hover:bg-zinc-700"
                  >
                    Close Dialog
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-950 dark:text-red-200 text-[11px] leading-relaxed">
                  <strong>Zero-Resistance Policy:</strong> Authors and link owners only need to identify the work/Drive link and verify ownership. Matched works are suppressed immediately.
                </div>

                {error && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {workId && (
                  <div className="p-2.5 rounded-lg bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark text-[11px] flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                      Selected Work: <strong className="text-gray-900 dark:text-gray-100">{workTitle || "Catalog Item"}</strong>
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-subtle-light dark:bg-subtle-dark text-gray-500 shrink-0">
                      Ref Linked
                    </span>
                  </div>
                )}

                {/* Target Work Title / File Name / Reference */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Work Title, File Name, or Reference ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    placeholder="e.g. Story Title, File Name, or Reference ID"
                    required
                    className="w-full p-2 border border-border-light dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-brand-trunk text-xs"
                  />
                </div>

                {/* Separate Dedicated Section: Proof of Ownership / Credibility */}
                <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                  <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>
                      Proof of Ownership or Credibility <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300/90 leading-relaxed">
                    Provide evidence connecting you to this work or Drive file (e.g., original archive/profile URL, Google Drive owner email/handle, or ownership context).
                  </p>
                  <textarea
                    value={ownershipProof}
                    onChange={(e) => setOwnershipProof(e.target.value)}
                    placeholder="e.g. Link to original author profile/post, Drive file owner account verification, or submission confirmation note..."
                    rows={3}
                    required
                    className="w-full p-2 border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-brand-trunk text-xs"
                  />
                </div>

                {/* Requester Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      Your Relationship to Work
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full p-2 border border-border-light dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-brand-trunk text-xs"
                    >
                      <option value="author">Original Fanfiction Author</option>
                      <option value="drive_owner">Google Drive Link Owner</option>
                      <option value="uploader">Original Submitter</option>
                      <option value="community">Community Reader (Report Issue)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-700 dark:text-gray-300">
                      Contact Email <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      placeholder="author@example.com"
                      className="w-full p-2 border border-border-light dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-brand-trunk text-xs"
                    />
                  </div>
                </div>

                {/* Preference */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Removal Scope
                  </label>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-700 dark:text-gray-300 pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="preference"
                        value="permanent"
                        checked={preference === "permanent"}
                        onChange={() => setPreference("permanent")}
                      />
                      <span>Permanent Removal</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="preference"
                        value="hide"
                        checked={preference === "hide"}
                        onChange={() => setPreference("hide")}
                      />
                      <span>Temporary Hide (Suppress from search)</span>
                    </label>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional notes (e.g., revoking mirror access or permissions changed)."
                    rows={2}
                    className="w-full p-2 border border-border-light dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-brand-trunk text-xs"
                  />
                </div>

                {/* Static Direct Email Clipboard Modal Trigger */}
                <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-border-light dark:border-border-dark">
                  Prefer direct email instead?{" "}
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="text-brand-trunk dark:text-brand-light hover:underline font-semibold"
                  >
                    Open Copyable Direct Email Details &rarr;
                  </button>
                </div>

                {/* Form actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-3 py-1.5 bg-subtle-light dark:bg-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-brand-trunk hover:bg-brand-bark text-white font-bold rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    {loading ? "Logging Request..." : "Submit Takedown Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      <DirectTakedownEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        workTitle={targetQuery || workTitle}
      />
    </>
  );
}
