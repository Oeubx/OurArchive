"use client";

import React from "react";
import Link from "next/link";
import { signInWithDiscord } from "@/lib/services/auth";

interface ContributorAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateLogin: () => void;
}

export function ContributorAuthGateModal({
  isOpen,
  onClose,
  onSimulateLogin,
}: ContributorAuthGateModalProps) {
  if (!isOpen) return null;

  return (
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
          To maintain reader safety and prevent malicious link injection, contributors must be signed in to submit and track Google Drive links.
        </p>

        {/* Sign In Options */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={async () => {
              try {
                await signInWithDiscord();
              } catch {
                onSimulateLogin();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-xs transition"
          >
            <span>🎮</span>
            <span>Sign In / Sign Up with Discord</span>
          </button>

          <button
            onClick={onSimulateLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold shadow-xs transition"
          >
            <span>⚡</span>
            <span>Fast Contributor Sign-In (Instant Demo)</span>
          </button>
        </div>

        {/* Email Fallback Option */}
        <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-2">
          <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
            Prefer not to sign in or create an account?
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Send us an email directly at{" "}
            <a
              href="mailto:ourarchive.aid@gmail.com"
              className="text-ao3-red dark:text-ao3-lightred font-mono font-medium underline"
            >
              ourarchive.aid@gmail.com
            </a>{" "}
            with your view-only Google Drive link and title, and our volunteers will verify and upload it for you upon inspection.
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
  );
}
