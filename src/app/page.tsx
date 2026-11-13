"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AboutContent } from "@/components/about/AboutContent";
import { AuthModal } from "@/components/auth/AuthModal";
import { ContributorAuthGateModal } from "@/components/contribute/ContributorAuthGateModal";
import { APP_VERSION } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

function AuthErrorQueryWatcher({
  onTriggerGate,
  onTriggerFeedbackSignIn,
}: {
  onTriggerGate: () => void;
  onTriggerFeedbackSignIn: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError === "contributor_login_required") {
      onTriggerGate();
    } else if (authError === "feedback_login_required") {
      onTriggerFeedbackSignIn();
    }
  }, [searchParams, onTriggerGate, onTriggerFeedbackSignIn]);

  return null;
}

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleTriggerGate = useCallback(() => {
    setShowGateModal(true);
  }, []);

  const handleTriggerFeedbackSignIn = useCallback(() => {
    setAuthMode("signin");
    setAuthRedirectTo("/feedback");
    setShowAuthModal(true);
  }, []);

  function openSignUp() {
    setAuthMode("signup");
    setAuthRedirectTo(undefined);
    setShowAuthModal(true);
  }

  return (
    <div className="space-y-8 py-4">
      {/* Search param watcher wrapped in Suspense for Next.js App Router static compliance */}
      <Suspense fallback={null}>
        <AuthErrorQueryWatcher
          onTriggerGate={handleTriggerGate}
          onTriggerFeedbackSignIn={handleTriggerFeedbackSignIn}
        />
      </Suspense>

      {/* =========================================================================
          CONTAINER 1: OurArchive Primary Hero Container
          ========================================================================= */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 sm:p-8 shadow-xs transition-colors duration-150">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: System Icon, System Name, and Description */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-border-light dark:border-border-dark shrink-0 shadow-sm bg-subtle-light dark:bg-subtle-dark relative ring-1 ring-brand-trunk/10">
              <Image
                src="/images/ourarchive-logo.jpg"
                alt="OurArchive System Icon"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-trunk dark:text-brand-light">
                  OurArchive
                </h1>
                <span className="text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-brand-bark dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  TEMPORARY PROJECT
                </span>
                <span className="text-[11px] font-medium bg-subtle-light dark:bg-subtle-dark text-gray-600 dark:text-gray-300 border border-border-light dark:border-border-dark px-2 py-0.5 rounded-full tracking-wide">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                This system&apos;s purpose is to compile cloud drive links into one centralized, searchable index. Enjoy distraction-free online reading, verified safety diagnostics, and direct redirection to the author&apos;s original drive mirror.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons (Search, Contribute, Sign Up with Bookmarking Subtext) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
            {/* Search Button */}
            <Link
              href="/search"
              className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-center"
            >
              <span>🔍</span>
              <span>SEARCH LIBRARY</span>
            </Link>

            {/* Contribute Button: Direct auth gate modal if not signed in, otherwise go to /contribute */}
            {isAuthenticated ? (
              <Link
                href="/contribute"
                className="w-full py-2.5 px-4 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 text-center"
              >
                <span>➕</span>
                <span>CONTRIBUTE LINK</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowGateModal(true)}
                className="w-full py-2.5 px-4 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 text-center"
              >
                <span>➕</span>
                <span>CONTRIBUTE LINK</span>
              </button>
            )}

            {/* Sign Up Section with Bookmarking Subtext */}
            <div className="pt-1 text-center space-y-1">
              <button
                type="button"
                onClick={openSignUp}
                className="w-full py-2.5 px-4 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-brand-bark dark:text-amber-200 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>⭐</span>
                <span>SIGN UP</span>
              </button>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                Sign up to unlock reading progress bookmarking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTAINER 2: ABOUT Container (Embedding about-developer content)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3 px-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📖</span>
            <span>About OurArchive & The Initiative</span>
          </h2>
          <Link
            href="/disclaimers"
            className="text-xs text-brand-trunk dark:text-brand-light font-medium hover:underline"
          >
            Read Community Disclaimers &rarr;
          </Link>
        </div>

        {/* Embedded About Developer & Platform Content */}
        <AboutContent />
      </section>

      {/* Auth Gate Modal */}
      <ContributorAuthGateModal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
      />

      {/* Auth Modal Triggered by Sign Up or Feedback Auth Redirect */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        redirectTo={authRedirectTo}
      />
    </div>
  );
}
