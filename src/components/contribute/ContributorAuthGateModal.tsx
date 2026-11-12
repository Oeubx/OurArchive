"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthModal } from "@/components/auth/AuthModal";
import { TAKEDOWN_EMAIL } from "@/lib/config";

interface ContributorAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL_SUBJECT = "[CONTRIBUTION] <Work Title> (View-Only Cloud Drive Link)";
const EMAIL_BODY_TEMPLATE = `Work Title: [Title of fanwork]
Author / Creator: [Author Name]
Fandom: [Fandom Name]
View-Only Cloud Link: [Drop your Google Drive, Dropbox, or OneDrive link here]
Additional Notes: [Optional pairing, rating, or chapter details]`;

export function ContributorAuthGateModal({
  isOpen,
  onClose,
}: ContributorAuthGateModalProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleCopy(text: string, type: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  }

  function handleDismiss() {
    // Clean up query param from URL if present
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("auth_error")) {
        url.searchParams.delete("auth_error");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
    onClose();
  }

  if (!isOpen || !mounted) return null;

  const mailtoUrl = `mailto:${TAKEDOWN_EMAIL}?subject=${encodeURIComponent(
    EMAIL_SUBJECT
  )}&body=${encodeURIComponent(EMAIL_BODY_TEMPLATE)}`;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                📬
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  Contribute Fanwork to OurArchive
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose how you would like to submit your cloud drive mirror
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 text-sm rounded-lg transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Option 1: Sign Up with Email (Recommended) */}
          <div className="p-4 rounded-xl bg-subtle-light/70 dark:bg-subtle-dark/70 border border-border-light dark:border-border-dark space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>⭐</span>
                <span>OPTION 1: Sign Up as Contributor</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Create a free account to track your submitted links, earn verified contributor badges, and manage your reading bookmarks.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-trunk hover:bg-brand-bark text-white text-xs font-bold shadow-xs transition"
              >
                <span>✉️</span>
                <span>Sign Up / Sign In with Email &rarr;</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light dark:border-border-dark" />
            </div>
            <span className="relative bg-surface-light dark:bg-surface-dark px-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Or Submit Directly via Email
            </span>
          </div>

          {/* Option 2: Direct Email Intake */}
          <div className="p-4 rounded-xl bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>📧</span>
                <span>OPTION 2: Direct Intake to Admin Triage</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Prefer not to create an account? Send your view-only cloud link directly to our administrative inbox. Our triage team will inspect, verify safety, and catalog it.
              </p>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Administrative Intake Email:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={TAKEDOWN_EMAIL}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(TAKEDOWN_EMAIL, "email")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                >
                  {copiedType === "email" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Email Subject Format */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Required Subject Format:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={EMAIL_SUBJECT}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(EMAIL_SUBJECT, "subject")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
                >
                  {copiedType === "subject" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Email Body Format Instructions */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Email Body Template:
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(EMAIL_BODY_TEMPLATE, "body")}
                  className="text-[11px] text-brand-trunk dark:text-brand-light font-medium hover:underline"
                >
                  {copiedType === "body" ? "✓ Template Copied" : "Copy Template"}
                </button>
              </div>
              <pre className="p-2.5 text-[11px] font-mono leading-relaxed bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {EMAIL_BODY_TEMPLATE}
              </pre>
            </div>

            {/* Launch Email Client Button */}
            <div className="pt-1">
              <a
                href={mailtoUrl}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-gray-800 dark:text-gray-200 text-xs font-semibold transition"
              >
                <span>📬</span>
                <span>Open Email Client with Template &rarr;</span>
              </a>
            </div>
          </div>

          {/* Footer action */}
          <div className="flex items-center justify-end pt-2 border-t border-border-light dark:border-border-dark">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark text-xs font-medium transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          handleDismiss();
        }}
        initialMode="signup"
      />
    </>,
    document.body
  );
}
