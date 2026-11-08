"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/AuthModal";
import { TAKEDOWN_EMAIL } from "@/lib/config";

interface ContributorAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLogin?: () => void;
}

export function ContributorAuthGateModal({
  isOpen,
  onClose,
}: ContributorAuthGateModalProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 text-gray-900 dark:text-gray-100">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border-light dark:border-border-dark pb-3">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                🔑
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Contributor Sign-In Required
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Authentication is needed to upload and manage links
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 text-sm rounded transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Reason notice */}
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            To maintain reader safety and prevent malicious link injection, contributors must be signed in with their email account to submit and track cloud drive links.
          </p>

          {/* Sign In Options */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold shadow-xs transition"
            >
              <span>✉️</span>
              <span>Sign In / Sign Up with Email</span>
            </button>
          </div>

          {/* Email Fallback Option */}
          <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-2">
            <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              Prefer not to create an account?
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Send an email to our administration team at{" "}
              <a
                href={`mailto:${TAKEDOWN_EMAIL}`}
                className="text-brand-trunk dark:text-brand-light font-mono font-medium underline"
              >
                {TAKEDOWN_EMAIL}
              </a>{" "}
              with your view-only cloud drive link and title, and our volunteers will verify and upload it for you upon inspection.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark text-xs">
            <Link
              href="/"
              onClick={onClose}
              className="text-gray-500 hover:underline"
            >
              &larr; Back to Library Index
            </Link>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark text-xs transition"
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
          onClose();
        }}
      />
    </>
  );
}
