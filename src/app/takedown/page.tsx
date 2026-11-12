"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TakedownModal } from "@/components/takedown/TakedownModal";
import { DirectTakedownEmailModal } from "@/components/takedown/DirectTakedownEmailModal";
import { createClient } from "@/lib/supabase/client";
import { TAKEDOWN_EMAIL } from "@/lib/config";

export default function TakedownPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const adminEmail = TAKEDOWN_EMAIL;

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!active) return;
        setIsAuthenticated(Boolean(user));
        setUserEmail(user?.email ?? null);
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
      {/* Header */}
      <div className="border-b border-border-light dark:border-border-dark pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-brand-trunk dark:text-brand-light hover:underline font-medium">
            &larr; Back to Library Index
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          Author Takedown & Removal Request Portal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Fast-Track Removal Desk • Unconditional Author Sovereignty Policy
        </p>
      </div>

      {/* Immediate Takedown Guarantee Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-600 rounded-r p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚨</span>
          <h2 className="text-base font-bold text-brand-bark dark:text-brand-light">
            Our Unconditional Removal Guarantee
          </h2>
        </div>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
          If you are the author, drive owner, or copyright holder of any fanwork indexed on this platform, you have the right to request its immediate, no-questions-asked removal.
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
          We require no legal notices, cease-and-desist forms, or bureaucratic delay. Simply submit the story title, file name, or reference ID below and action will be taken within 24 hours of receiving your request.
        </p>
      </div>

      {/* Two Intake Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathway 1: Fast-Track Portal (Signed-In Users) */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Method 1: Instant Takedown Form
                </h2>
              </div>
              {!isAuthenticated && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60">
                  Sign-In Required
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              {isAuthenticated
                ? "Submit an instant takedown using the work title or file name. Your account email is prefilled automatically and matched works are suppressed right away."
                : "Signed-in users can submit instant in-system takedowns. If you are not signed in, please use Method 2 (Direct Email to Admin) with a screenshot from /search."}
            </p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg font-bold shadow-xs transition text-center"
            >
              Open Interactive Takedown Form &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg font-bold shadow-xs transition text-center"
            >
              Use Method 2: Direct Email to Admin &rarr;
            </button>
          )}
        </section>

        {/* Pathway 2: Direct Email Desk */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📬</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Method 2: Direct Email to Admin
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              For unsigned users or direct correspondence: open our copyable email template and attach a basic screenshot of the work inside <strong>/search</strong> along with your ownership verification.
            </p>
            <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark font-mono text-[11px] text-brand-trunk dark:text-brand-light select-all">
              {adminEmail}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="w-full py-2.5 px-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 rounded-lg font-bold hover:bg-subtle-light dark:hover:bg-subtle-dark transition text-center"
          >
            Copy Email Address &amp; Template &rarr;
          </button>
        </section>
      </div>

      {/* Frequently Asked Questions */}
      <section className="space-y-4 border-t border-border-light dark:border-border-dark pt-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Frequently Asked Questions regarding Takedowns
        </h2>

        <div className="space-y-3">
          <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark space-y-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              How quickly is a work taken down?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              In-system submissions hide the item from search queries right away, and full removal of cached reader data is completed within 24 hours of receiving your request.
            </p>
          </div>

          <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark space-y-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              What if someone uploaded a shared drive with multiple stories?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              OurArchive supports granular work-level takedowns. You can specify a single story to be suppressed without affecting other fanworks sharing that cloud folder.
            </p>
          </div>

          <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark space-y-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Does OurArchive store copies of my story on disk?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No. OurArchive operates under a strict <strong>Zero-Download</strong> architecture. No files (`.pdf`, `.html`, `.epub`) are saved permanently on our servers.
            </p>
          </div>
        </div>
      </section>

      {/* Modal Containers */}
      <TakedownModal
        isOpen={modalOpen}
        userEmail={userEmail}
        onClose={() => setModalOpen(false)}
      />
      <DirectTakedownEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
