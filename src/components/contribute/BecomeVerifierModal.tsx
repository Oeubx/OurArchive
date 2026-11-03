"use client";

import React, { useState } from "react";
import { submitVerifierApplication } from "@/lib/contributorService";

interface BecomeVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function BecomeVerifierModal({
  isOpen,
  onClose,
  userEmail = "reader@example.com",
  userName = "Active Reader",
}: BecomeVerifierModalProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [reason, setReason] = useState("");
  const [trustPledge, setTrustPledge] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please explain why you want to become a verifier.");
      return;
    }
    if (!trustPledge.trim()) {
      setError("Please describe how you will ensure the safety of fellow readers.");
      return;
    }
    if (!acceptedPolicy) {
      setError("You must acknowledge the reader safety pledge.");
      return;
    }

    setSubmitting(true);
    try {
      submitVerifierApplication({
        userName: name,
        userEmail: email,
        reason,
        trustPledge,
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setReason("");
    setTrustPledge("");
    setAcceptedPolicy(false);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
          <div className="flex items-center gap-2.5">
            <div className="text-2xl p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-900">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Become a Community Verifier
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Help verify and protect links for the fanfiction community
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 text-sm rounded transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Application Submitted!
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              Thank you for volunteering to protect fellow readers. Platform administrators review incoming verifier applications regularly. You will be notified once reviewed.
            </p>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-xs">
                {error}
              </div>
            )}

            {/* Applicant details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Your Name / Handle:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            {/* Question 1: Why do you want to be one */}
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Why do you want to become a verifier? <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share your interest in helping maintain the emergency archive during outages..."
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder-gray-500 text-xs leading-relaxed"
                required
              />
            </div>

            {/* Question 2: Can they be trusted with the safety of fellow readers */}
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Can you be trusted with the safety of fellow readers? <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={trustPledge}
                onChange={(e) => setTrustPledge(e.target.value)}
                placeholder="Describe your approach to checking Google Drive permissions (view-only), identifying malware or malicious links, and handling author content responsibly..."
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder-gray-500 text-xs leading-relaxed"
                required
              />
            </div>

            {/* Safety policy agreement checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="trust-checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-ao3-red focus:ring-ao3-red"
              />
              <label
                htmlFor="trust-checkbox"
                className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer"
              >
                I understand that opening unverified links carries risk, and I pledge to examine metadata cautiously, uphold author privacy, and never approve suspicious executables or writable links.
              </label>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-xs transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
