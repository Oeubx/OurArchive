"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UploadModal } from "@/components/upload/UploadModal";
import { AssistedIntakeModal } from "@/components/upload/AssistedIntakeModal";

export default function ContributePage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssistedModal, setShowAssistedModal] = useState(false);

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="space-y-2 border-b border-border-light dark:border-border-dark pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">Home</Link> &rarr; <span>Contribute</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Contribute to the Emergency Archive
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share author-approved view-only Google Drive links to keep transformative works accessible during AO3 outages.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-5 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm">
          <span>⚠️ Reader Safety Notice</span>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          All contributed links undergo automated threat scanning and human verification before appearing in the public archive. This ensures view-only permissions, validates document MIME types, and protects our community from malicious files.
        </p>
      </div>

      {/* Two Contribution Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Upload Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-2xl">🔗</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Submit Direct Drive Link
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have an author-approved, view-only Google Drive link (PDF, Google Doc, or HTML format), submit it directly through our instant validation form.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full py-2.5 px-4 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-xs transition text-center"
          >
            Open Submission Form
          </button>
        </div>

        {/* Assisted Intake Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-2xl">🤝</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Assisted Intake / Email Submission
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Prefer not to sign in? Send us an email directly at{" "}
              <a href="mailto:ourarchive.aid@gmail.com" className="text-ao3-red dark:text-ao3-lightred underline font-mono">
                ourarchive.aid@gmail.com
              </a>{" "}
              or use the assisted intake desk, and our team will verify and index it manually.
            </p>
          </div>
          <button
            onClick={() => setShowAssistedModal(true)}
            className="w-full py-2.5 px-4 bg-canvas-light dark:bg-canvas-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 text-xs font-semibold rounded transition text-center"
          >
            Assisted Intake Request
          </button>
        </div>
      </div>

      {/* Guidelines Accordion */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
          📋 Submission Guidelines & Rules
        </h3>
        <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
          <li><strong>View-Only Requirement:</strong> Links must have edit permissions disabled (&ldquo;Anyone with the link can view&rdquo;). Writable links are rejected automatically.</li>
          <li><strong>Allowed Formats:</strong> PDF, Google Docs, EPUB, and Plain Text. Executables, macro files, and password-protected archives are strictly blocked.</li>
          <li><strong>Author Consent:</strong> Only share works where the author has approved emergency distribution.</li>
        </ul>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
      <AssistedIntakeModal
        isOpen={showAssistedModal}
        onClose={() => setShowAssistedModal(false)}
      />
    </div>
  );
}
