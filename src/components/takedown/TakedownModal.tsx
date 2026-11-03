"use client";

import React, { useState, useEffect } from "react";

interface TakedownModalProps {
  isOpen: boolean;
  workId?: string | null;
  workTitle?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TakedownModal({
  isOpen,
  workId,
  workTitle,
  onClose,
  onSuccess,
}: TakedownModalProps) {
  const [targetQuery, setTargetQuery] = useState("");
  const [role, setRole] = useState("author");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [reason, setReason] = useState("");
  const [preference, setPreference] = useState<"permanent" | "hide">("permanent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetQuery(workId || workTitle || "");
      setRole("author");
      setRequesterEmail("");
      setReason("");
      setPreference("permanent");
      setError(null);
      setSubmitted(false);
    }
  }, [isOpen, workId, workTitle]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetQuery.trim()) {
      setError("Please provide the Work ID, Story Title, or Google Drive URL.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-ao3-red text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">🚨 Immediate Takedown & Removal Request</span>
          </div>
          <button
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
            <h3 className="text-base font-bold text-gray-900">
              Takedown Request Processed Immediately
            </h3>
            <p className="text-gray-600 leading-relaxed text-xs">
              In accordance with our zero-resistance policy, this fanwork has been <strong>immediately hidden</strong> from the public search index and reader viewer while final administrative purge is verified.
            </p>
            {requesterEmail && (
              <p className="text-gray-500 text-[11px]">
                A confirmation note has been dispatched to <strong>{requesterEmail}</strong>.
              </p>
            )}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded font-medium transition hover:bg-gray-800"
              >
                Close Dialog
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* The Guarantee notice */}
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-950 text-[11px] leading-relaxed">
              <strong>Zero-Resistance Policy:</strong> Authors and link owners only need to ask. No notarized legal forms or debates required. Content is suppressed immediately.
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Target work */}
            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">
                Work Title, ID, or Google Drive URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="e.g. Story Title, UUID, or https://drive.google.com/file/d/..."
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red text-xs"
              />
            </div>

            {/* Requester Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Your Relationship to Work</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red text-xs bg-white"
                >
                  <option value="author">Original Fanfiction Author</option>
                  <option value="drive_owner">Google Drive Link Owner</option>
                  <option value="uploader">Original Submitter</option>
                  <option value="community">Community Reader (Report Issue)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">
                  Your Email <span className="text-gray-400 font-normal">(Optional for confirmation)</span>
                </label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="author@example.com"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red text-xs"
                />
              </div>
            </div>

            {/* Preference */}
            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">Removal Scope</label>
              <div className="flex items-center gap-4 text-[11px] text-gray-700 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="preference"
                    value="permanent"
                    checked={preference === "permanent"}
                    onChange={() => setPreference("permanent")}
                  />
                  <span>Permanent Database Purge (Total expungement)</span>
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
              <label className="block font-semibold text-gray-700">
                Additional Notes or Context <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly state reason (e.g., 'I am the author and wish to revoke mirror access', or 'Permissions updated to private')."
                rows={2}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red text-xs"
              />
            </div>

            {/* Direct Email fallback note */}
            <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
              Prefer direct email? Send your link or title to{" "}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_TAKEDOWN_EMAIL || "takedown-ourarchive@proton.me"}?subject=[TAKEDOWN]%20Removal%20Request`}
                className="text-ao3-red hover:underline font-semibold"
              >
                {process.env.NEXT_PUBLIC_TAKEDOWN_EMAIL || "takedown-ourarchive@proton.me"}
              </a>
              .
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-ao3-red hover:bg-ao3-darkred text-white font-bold rounded shadow-xs transition disabled:opacity-50"
              >
                {loading ? "Processing Immediate Hide..." : "Request Immediate Removal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
