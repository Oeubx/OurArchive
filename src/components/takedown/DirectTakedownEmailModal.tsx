"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TAKEDOWN_EMAIL } from "@/lib/config";

interface DirectTakedownEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workTitle?: string | null;
}

const EMAIL_SUBJECT = "[TAKEDOWN] Author Removal Request";

export function DirectTakedownEmailModal({
  isOpen,
  onClose,
  workTitle,
}: DirectTakedownEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const emailBodyTemplate = `Target Work Title: ${workTitle || "[Insert Story Title or Reference ID]"}
Pointed Google Drive Link: [Paste the Google Drive File or Folder URL]
My Role: [Original Author / Google Drive Owner / Submitter / Community Reporter]
Proof of Ownership or Credibility: [Link to original work profile, account proof, or explanation]
Requested Action: [Permanent Database Purge / Temporary Hide]
Additional Notes: [Optional context]`;

  async function handleCopy(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback ignored on restricted clipboard environments
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-takedown-email-title"
    >
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark text-xs">
        {/* Header */}
        <div className="bg-brand-trunk text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📬</span>
            <h2 id="direct-takedown-email-title" className="text-sm font-bold">
              Direct Takedown Email Desk (Copy to Clipboard)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Copy the takedown email address and structured template below, then send it directly from Gmail, Proton, Outlook, or your preferred email provider.
          </p>

          {/* Copy Email Address */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-800 dark:text-gray-200">
              Takedown Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={TAKEDOWN_EMAIL}
                className="flex-1 px-3 py-2 font-mono text-xs bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleCopy(TAKEDOWN_EMAIL, "email")}
                className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 font-semibold transition shrink-0"
              >
                {copiedField === "email" ? "✓ Copied" : "Copy Email"}
              </button>
            </div>
          </div>

          {/* Copy Subject Line */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-800 dark:text-gray-200">
              Recommended Subject Line
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={EMAIL_SUBJECT}
                className="flex-1 px-3 py-2 font-mono text-xs bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleCopy(EMAIL_SUBJECT, "subject")}
                className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-subtle-light dark:bg-subtle-dark hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 font-semibold transition shrink-0"
              >
                {copiedField === "subject" ? "✓ Copied" : "Copy Subject"}
              </button>
            </div>
          </div>

          {/* Copy Formatted Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="font-semibold text-gray-800 dark:text-gray-200">
                Email Body Template (Includes Drive Link &amp; Ownership Proof)
              </label>
              <button
                type="button"
                onClick={() => handleCopy(emailBodyTemplate, "body")}
                className="px-2.5 py-1 rounded bg-brand-trunk hover:bg-brand-bark text-white font-semibold transition text-[11px]"
              >
                {copiedField === "body" ? "✓ Template Copied" : "Copy Template"}
              </button>
            </div>
            <pre className="p-3 text-[11px] font-mono leading-relaxed bg-canvas-light dark:bg-canvas-dark border border-border-light dark:border-border-dark rounded-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {emailBodyTemplate}
            </pre>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-border-light dark:border-border-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-zinc-800 hover:bg-gray-800 dark:hover:bg-zinc-700 text-white font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
