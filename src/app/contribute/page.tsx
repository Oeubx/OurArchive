"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ContributorAuthGateModal } from "@/components/contribute/ContributorAuthGateModal";
import { BecomeVerifierModal } from "@/components/contribute/BecomeVerifierModal";
import { ContributorTable } from "@/components/contribute/ContributorTable";
import { UploadModal } from "@/components/upload/UploadModal";
import { createClient } from "@/lib/supabase/client";
import { getMyContributions, addMyContribution } from "@/lib/contributorService";
import { DriveLink } from "@/lib/types";

export default function ContributePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("contributor@example.com");
  const [userName, setUserName] = useState<string>("Community Contributor");

  const [contributions, setContributions] = useState<DriveLink[]>([]);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showVerifierModal, setShowVerifierModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();

    function evaluateAuth(user: { email?: string; user_metadata?: { full_name?: string } } | null) {
      const devAuth = typeof window !== "undefined" ? localStorage.getItem("ourarchive_dev_auth") : null;
      if (devAuth === "authenticated") {
        setIsAuthenticated(true);
        setUserEmail(localStorage.getItem("ourarchive_dev_email") || "contributor@example.com");
        setUserName(localStorage.getItem("ourarchive_dev_name") || "Demo Contributor");
        setShowAuthGate(false);
        return;
      }

      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || "contributor@example.com");
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Contributor");
        setShowAuthGate(false);
      } else {
        setIsAuthenticated(false);
        setShowAuthGate(true);
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

    setContributions(getMyContributions());

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function handleSimulateLogin() {
    if (typeof window !== "undefined") {
      localStorage.setItem("ourarchive_dev_auth", "authenticated");
      localStorage.setItem("ourarchive_dev_email", "reader_charlie@example.com");
      localStorage.setItem("ourarchive_dev_name", "reader_charlie");
    }
    setIsAuthenticated(true);
    setUserEmail("reader_charlie@example.com");
    setUserName("reader_charlie");
    setShowAuthGate(false);
    setContributions(getMyContributions());
  }

  function handleSignOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ourarchive_dev_auth");
      localStorage.removeItem("ourarchive_dev_email");
      localStorage.removeItem("ourarchive_dev_name");
    }
    setIsAuthenticated(false);
    setShowAuthGate(true);
  }

  function handleUploadSuccess() {
    setContributions(getMyContributions());
    setShowUploadModal(false);
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

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400">
              Signed in as <strong className="text-gray-900 dark:text-gray-100">{userName}</strong>
            </span>
            <button
              onClick={handleSignOut}
              className="text-brand-trunk dark:text-brand-light hover:underline text-[11px]"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* TOP MOST CONTENT: Warning Sign & Become a Verifier Button */}
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

      {/* MAIN CONTENT: Contributor Uploads Display Table */}
      <section>
        <ContributorTable
          contributions={contributions}
          onUploadClick={() => setShowUploadModal(true)}
        />
      </section>

      {/* Modals */}
      <ContributorAuthGateModal
        isOpen={showAuthGate && !isAuthenticated}
        onClose={() => setShowAuthGate(false)}
        onSimulateLogin={handleSimulateLogin}
      />

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
