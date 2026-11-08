"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TakedownModal } from "@/components/takedown/TakedownModal";

export default function TakedownPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const adminEmail =
    process.env.NEXT_PUBLIC_TAKEDOWN_EMAIL || "takedown-ourarchive@proton.me";

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-xs text-gray-800 leading-relaxed">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-brand-trunk hover:underline font-medium">
            &larr; Back to Library Index
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Immediate Takedown & Removal Request Portal
        </h1>
        <p className="text-gray-500 mt-1">
          Zero-Resistance Author & Owner Removal Policy • Module 3 Compliance
        </p>
      </div>

      {/* Primary Guarantee Banner */}
      <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg text-red-950 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <h2 className="text-lg font-bold text-red-900">
            The Immediate Takedown Guarantee
          </h2>
        </div>
        <blockquote className="border-l-4 border-brand-trunk pl-4 py-1 text-base font-bold italic text-brand-trunk">
          &ldquo;You only have to reach out, and the administrator will remove it immediately.&rdquo;
        </blockquote>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white p-3 rounded border border-red-200">
            <strong className="block text-red-900 mb-1">Zero Bureaucracy</strong>
            No legal documentation, notarized forms, or formalities required.
          </div>
          <div className="bg-white p-3 rounded border border-red-200">
            <strong className="block text-red-900 mb-1">Zero Resistance</strong>
            We will not challenge, debate, or delay your request.
          </div>
          <div className="bg-white p-3 rounded border border-red-200">
            <strong className="block text-red-900 mb-1">Instant Suppression</strong>
            Content is suppressed immediately while cascade purge completes.
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-brand-trunk hover:bg-brand-bark text-white text-sm font-bold rounded shadow transition"
          >
            Launch Interactive Takedown Form &rarr;
          </button>
        </div>
      </div>

      {/* Alternative Submission Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Option A: Direct Email */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="text-xl">✉️</div>
          <h3 className="text-sm font-bold text-gray-900">Option A: Direct Email</h3>
          <p className="text-gray-600">
            Send an email directly to the emergency takedown mailbox:
          </p>
          <a
            href={`mailto:${adminEmail}?subject=[TAKEDOWN]%20Removal%20Request`}
            className="inline-block text-brand-trunk font-mono font-bold hover:underline break-all"
          >
            {adminEmail}
          </a>
          <p className="text-[11px] text-gray-500">
            Subject: <code>[TAKEDOWN] Story Title or Drive URL</code>
          </p>
        </div>

        {/* Option B: Discord Direct Message */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="text-xl">💬</div>
          <h3 className="text-sm font-bold text-gray-900">Option B: Community Discord</h3>
          <p className="text-gray-600">
            Direct message an administrator or ping the support channel in the OurArchive emergency community server.
          </p>
          <span className="inline-block bg-gray-100 px-2 py-1 rounded text-[11px] font-mono text-gray-700">
            Discord Tag: @biboy
          </span>
        </div>

        {/* Option C: GitHub Issue */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="text-xl">🐙</div>
          <h3 className="text-sm font-bold text-gray-900">Option C: GitHub Issue</h3>
          <p className="text-gray-600">
            Open an issue in this repository with the label <code>takedown</code> or send a private repository advisory.
          </p>
          <span className="inline-block text-gray-500 text-[11px]">
            Fast-track review within 1 hour.
          </span>
        </div>
      </div>

      {/* Detailed Protocol Explanation */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-gray-900">
          What Happens When a Removal Notice is Received?
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>
            <strong>Instant Hide (Seconds):</strong> The work&apos;s visibility flag <code>is_hidden</code> is immediately set to <code>true</code>. The story is instantaneously removed from public search results, reader feeds, and API reveal endpoints.
          </li>
          <li>
            <strong>Permanent Database Purge:</strong> The administrator executes a cascade deletion:
            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
              <li>Google Drive URL and File ID are removed from <code>drive_links</code>.</li>
              <li>Title, author name, pairing, and search tokens in <code>link_metadata</code> are expunged.</li>
              <li>Verification logs and risk scores in <code>link_verifications</code> are purged.</li>
            </ul>
          </li>
          <li>
            <strong>Temporary Hiding vs Permanent Deletion:</strong> If you are a Drive owner who simply wants the mirror temporarily paused while updating permissions, specify &ldquo;Temporary Hide&rdquo; and we will retain the record in paused status.
          </li>
        </ol>
      </section>

      {/* Footer navigation */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-gray-500">
        <span>OurArchive Emergency Bridge Governance</span>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:underline">
            Home Index
          </Link>
          <Link href="/disclaimers" className="hover:underline">
            Community Charter
          </Link>
          <Link href="/api/health" className="hover:underline" target="_blank">
            System Telemetry
          </Link>
        </div>
      </div>

      {/* Interactive Modal */}
      <TakedownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
