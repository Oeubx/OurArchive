"use client";

import React, { useState } from "react";
import { signInWithDiscord, signInWithMagicLink } from "@/lib/services/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function AuthModal({ isOpen, onClose, redirectTo }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"discord" | "magic-link" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  async function handleDiscordLogin() {
    try {
      setLoading("discord");
      setErrorMsg(null);
      await signInWithDiscord(redirectTo);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to initiate Discord login");
      setLoading(null);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    try {
      setLoading("magic-link");
      setErrorMsg(null);
      await signInWithMagicLink(email.trim(), redirectTo);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-6 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <h2 id="auth-modal-title" className="text-xl font-bold text-gray-900">
            Sign In to OurArchive
          </h2>
          <p className="text-xs text-gray-600">
            Sign in to submit and manage verified fanwork Google Drive mirrors during archive maintenance.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        {magicLinkSent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center space-y-2">
            <div className="text-emerald-700 font-semibold text-sm">Magic Link Dispatched!</div>
            <p className="text-xs text-emerald-800">
              Check <strong>{email}</strong> for your secure login link. You can close this window.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
              className="mt-2 text-xs text-ao3-red hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Option A: Discord OAuth */}
            <button
              onClick={handleDiscordLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded transition disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>{loading === "discord" ? "Connecting..." : "Continue with Discord"}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-2 text-[11px] uppercase tracking-wider text-gray-500">
                Or with Email
              </span>
              <div className="border-t border-gray-200 w-full" />
            </div>

            {/* Option B: Email Magic Link */}
            <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
              <div>
                <label htmlFor="auth-email-input" className="block text-xs font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="archivist@fandom.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red focus:border-ao3-red outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading !== null || !email}
                className="w-full py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded transition disabled:opacity-50"
              >
                {loading === "magic-link" ? "Sending Link..." : "Send Magic Link"}
              </button>
            </form>
          </div>
        )}

        <div className="text-[11px] text-gray-500 text-center leading-relaxed">
          By signing in, you agree to our strictly read-only archive terms and zero-download emergency operational policy.
        </div>
      </div>
    </div>
  );
}
