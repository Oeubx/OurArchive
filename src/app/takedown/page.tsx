"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TakedownModal } from "@/components/takedown/TakedownModal";
import { TAKEDOWN_EMAIL } from "@/lib/config";

export default function TakedownPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const adminEmail = TAKEDOWN_EMAIL;

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
          We require no legal notices, cease-and-desist forms, or bureaucratic delay. Simply submit the story title, Work ID, or cloud drive URL below and the link will be permanently purged or suppressed within minutes.
        </p>
      </div>

      {/* Two Intake Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathway 1: Fast-Track Portal */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Method 1: Instant Takedown Form
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              Use our interactive form to target a specific Work ID or cloud drive URL. This immediately flags the item in our system and initiates suppression from public search.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white rounded-lg font-bold shadow-xs transition text-center"
          >
            Open Interactive Takedown Form &rarr;
          </button>
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
              Prefer writing directly? Send an email to our administrator mailbox. Please include the story title or cloud link so we can locate the record.
            </p>
            <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark font-mono text-[11px] text-brand-trunk dark:text-brand-light select-all">
              {adminEmail}
            </div>
          </div>
          <a
            href={`mailto:${adminEmail}?subject=[TAKEDOWN]%20Author%20Removal%20Request`}
            className="w-full py-2.5 px-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 rounded-lg font-bold hover:bg-subtle-light dark:hover:bg-subtle-dark transition text-center"
          >
            Compose Email in Mail Client &rarr;
          </a>
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
              Immediate form submissions suppress the item from search queries instantly. Administrative purge of cached reader state occurs in under 24 hours.
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

      {/* Modal Container */}
      <TakedownModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
