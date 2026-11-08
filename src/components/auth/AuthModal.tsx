"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  signInWithEmailPassword,
  signUpWithEmailPassword,
  resendConfirmationEmail,
} from "@/lib/services/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  initialMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  redirectTo,
  initialMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Interstitial Confirmation Screen State
  const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);

  // Email Confirmation Sent Screen State (Option B)
  const [confirmationPendingEmail, setConfirmationPendingEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  function resetState() {
    setEmail("");
    setPassword("");
    setDisclaimerAccepted(false);
    setErrorMsg(null);
    setShowResend(false);
    setResendStatus(null);
    setShowConfirmationScreen(false);
    setConfirmationPendingEmail(null);
    onClose();
  }

  function handleFormValidation(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setShowResend(false);

    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters in length.");
      return;
    }

    if (!disclaimerAccepted) {
      setErrorMsg("You must check the box confirming you have read the community disclaimers.");
      return;
    }

    // Form inputs and disclaimer checkbox are valid -> show interstitial confirmation view
    setShowConfirmationScreen(true);
  }

  async function handleProceedWithAuth() {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === "signin") {
        await signInWithEmailPassword(email, password);
        resetState();
        window.location.reload();
      } else {
        const { session } = await signUpWithEmailPassword(email, password, redirectTo);
        if (!session) {
          // Supabase has 'Confirm email' enabled (Option B) -> Confirmation email sent
          setConfirmationPendingEmail(email);
          setShowConfirmationScreen(false);
        } else {
          // Instant sign-in occurred
          resetState();
          window.location.reload();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
      setShowConfirmationScreen(false); // Return to form so user sees error and can correct

      if (msg.toLowerCase().includes("email not confirmed")) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    if (!email) return;
    try {
      setResendStatus("Resending confirmation email...");
      await resendConfirmationEmail(email, redirectTo);
      setResendStatus("Confirmation email resent! Please check your inbox and spam folder.");
    } catch (err: unknown) {
      setResendStatus(err instanceof Error ? err.message : "Failed to resend confirmation email.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-border-light dark:border-border-dark p-6 space-y-6 text-gray-900 dark:text-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={resetState}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* View 1: Option B - Confirmation Email Dispatched Screen */}
        {confirmationPendingEmail ? (
          <div className="py-4 text-center space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Check Your Inbox to Confirm
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              We have sent a verification link to <strong>{confirmationPendingEmail}</strong>. Please confirm your email address to unlock reading bookmarks and submissions.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleResendEmail}
                className="text-xs text-brand-trunk dark:text-brand-light font-semibold hover:underline"
              >
                Didn&apos;t receive an email? Resend verification
              </button>
              {resendStatus && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900">
                  {resendStatus}
                </div>
              )}
              <button
                onClick={resetState}
                className="mt-3 px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg transition"
              >
                Close & Return to Library
              </button>
            </div>
          </div>
        ) : showConfirmationScreen ? (
          /* View 2: Interstitial Confirmation Dialog */
          <div className="space-y-5 py-2">
            <div className="space-y-2 text-center">
              <div className="text-3xl">⚖️</div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Are you sure you&apos;ve checked out the disclaimer?
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-left bg-canvas-light dark:bg-canvas-dark p-3.5 rounded-lg border border-border-light dark:border-border-dark">
                OurArchive operates as an emergency reading directory under strict <strong>Zero-Download</strong> and <strong>Creator Sovereignty</strong> principles. Authors retain 100% intellectual rights and immediate removal rights.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleProceedWithAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Yes, Proceed to Sign In"
                  : "Yes, Proceed to Create Account"}
              </button>

              <a
                href="/disclaimers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 text-xs font-medium rounded-lg transition"
              >
                <span>Re-open Disclaimers Page in New Tab</span>
                <span aria-hidden="true">&rarr;</span>
              </a>

              <button
                type="button"
                onClick={() => setShowConfirmationScreen(false)}
                className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                &larr; Back to edit details
              </button>
            </div>
          </div>
        ) : (
          /* View 3: Primary Credentials Form */
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="space-y-1">
              <h2 id="auth-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {mode === "signin" ? "Sign In to OurArchive" : "Create an Account"}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {mode === "signin"
                  ? "Sign in to submit fanwork mirrors and sync your reading progress."
                  : "Sign up to unlock reading bookmarks and participate in library moderation."}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                <div>{errorMsg}</div>
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    className="mt-2 text-xs font-bold text-brand-trunk dark:text-brand-light underline block"
                  >
                    Click here to resend the confirmation email &rarr;
                  </button>
                )}
              </div>
            )}

            {resendStatus && (
              <div className="p-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                {resendStatus}
              </div>
            )}

            <form onSubmit={handleFormValidation} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1">
                <label
                  htmlFor="auth-email-input"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="archivist@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-brand-trunk focus:border-brand-trunk outline-hidden shadow-2xs transition"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label
                  htmlFor="auth-password-input"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-brand-trunk focus:border-brand-trunk outline-hidden shadow-2xs transition"
                />
              </div>

              {/* Disclaimer Checkbox & Link */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-zinc-700 text-brand-trunk focus:ring-brand-trunk cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                    I have read and agree to the{" "}
                    <Link
                      href="/disclaimers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-trunk dark:text-brand-light font-semibold underline hover:opacity-80"
                    >
                      Community Disclaimers & Charter
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {mode === "signin" ? "Sign In" : "Sign Up"}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="pt-2 text-center text-xs text-gray-600 dark:text-gray-400 border-t border-border-light dark:border-border-dark">
              {mode === "signin" ? (
                <div>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                    }}
                    className="text-brand-trunk dark:text-brand-light font-semibold hover:underline"
                  >
                    Sign up to unlock bookmarks
                  </button>
                </div>
              ) : (
                <div>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg(null);
                    }}
                    className="text-brand-trunk dark:text-brand-light font-semibold hover:underline"
                  >
                    Sign in with email
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
