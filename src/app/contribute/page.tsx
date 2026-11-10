"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BecomeVerifierModal } from "@/components/contribute/BecomeVerifierModal";
import { ContributorTable } from "@/components/contribute/ContributorTable";
import { UploadModal } from "@/components/upload/UploadModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { getMyContributions, fetchUserContributions } from "@/lib/contributorService";
import { useRealtimeDriveLinks } from "@/lib/hooks/useRealtimeDriveLinks";
import { DriveLink } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export default function ContributePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("contributor");

  const [contributions, setContributions] = useState<DriveLink[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerifierModal, setShowVerifierModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Check authentic Supabase auth state on mount
  useEffect(() => {
    const supabase = createClient();

    function evaluateAuth(user: User | null) {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);
        setUserEmail(user.email || "");
        const role = ((user.app_metadata as Record<string, unknown> | undefined)?.role as string) || "contributor";
        setUserRole(role);
        setUserName(
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Contributor"
        );
        // Load authentic contributions from Supabase
        fetchUserContributions(user.id).then((items) => {
          setContributions(items);
        });
      } else {
        setIsAuthenticated(false);
        setUserId("");
        setContributions([]);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      evaluateAuth(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluateAuth(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time synchronization: Automatically update contributor table on triage status changes
  useRealtimeDriveLinks(
    () => {
      if (userId) {
        fetchUserContributions(userId).then((items) => {
          setContributions(items);
        });
      }
    },
    { enabled: Boolean(userId) }
  );

  async function handleUploadSuccess() {
    if (userId) {
      const items = await fetchUserContributions(userId);
      setContributions(items);
    }
    setShowUploadModal(false);
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-3">
        <div className="h-8 bg-subtle-light dark:bg-subtle-dark animate-pulse rounded-lg w-1/2 mx-auto" />
        <div className="h-4 bg-subtle-light dark:bg-subtle-dark animate-pulse rounded w-3/4 mx-auto" />
      </div>
    );
  }

  // Unauthenticated Strict Gate: Blocks access completely
  if (!isAuthenticated) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-3xl">
            🔑
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Contributor Sign-In Required
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              To maintain reader safety and prevent unverified link injections, you must sign in with your email account to contribute fanworks.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              Sign In to Contribute &rarr;
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-4 py-2.5 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl transition text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          redirectTo="/contribute"
        />
      </div>
    );
  }

  return (
    <div className="py-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-border-light dark:border-border-dark pb-3">
        <div className="flex items-center gap-1.5">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&rarr;</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Contribute Portal</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">
            Signed in as <strong className="text-gray-900 dark:text-gray-100">{userName}</strong>
          </span>
        </div>
      </div>

      {/* Warning Sign & Become a Verifier Button (Hidden for Admins and Verifiers) */}
      {userRole !== "admin" && userRole !== "verifier" && (
        <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-xs transition-colors duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm">
                <span className="text-base">⚠️</span>
                <span>Reader Safety & Verification Notice</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-2xl">
                All contributed and uploaded links shall go through strict verification to avoid malicious hacking, dangerous executable downloads, or broken permissions, for the safety and peace of mind of our fellow readers.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => setShowVerifierModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>🛡️</span>
                <span>Become a Verifier</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Contributor Uploads Display Table */}
      <section>
        <ContributorTable
          contributions={contributions}
          onUploadClick={() => setShowUploadModal(true)}
        />
      </section>

      {/* Modals */}
      <BecomeVerifierModal
        isOpen={showVerifierModal}
        onClose={() => setShowVerifierModal(false)}
        userEmail={userEmail}
        userName={userName}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
