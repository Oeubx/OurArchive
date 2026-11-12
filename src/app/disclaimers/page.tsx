import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Disclaimers & Governance Charter — OurArchive",
  description:
    "Legal notices, creator rights, transformative fair use, and community safety policies.",
};

export default function DisclaimersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
      {/* Page Header */}
      <div className="border-b border-border-light dark:border-border-dark pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-brand-trunk dark:text-brand-light hover:underline font-medium">
            &larr; Back to Library Index
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          OurArchive Community Disclaimers & Governance Charter
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Last Updated: November 2026 • Community Safety & Compliance Charter
        </p>
      </div>

      {/* Emergency Scope Box */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-600 rounded-r text-gray-800 dark:text-gray-200 space-y-1">
        <h2 className="font-bold text-sm text-brand-bark dark:text-brand-light">
          Emergency Platform Scope & Community Charter
        </h2>
        <p>
          <strong>OurArchive</strong> was created as an emergency, temporary measure to aid fanfiction readers and authors during service disruptions. It is strictly not intended to replace, compete with, or replicate permanent operations of primary fanwork archives.
        </p>
      </div>

      {/* Core Governance Pillars */}
      <div className="space-y-6">
        {/* Pillar 1 */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✍️</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              1. Respect for Fanfiction Creator Sovereignty
            </h2>
          </div>
          <p>
            Fanfiction authors retain <strong>100% intellectual and moral ownership</strong> over their works. OurArchive does not claim any copyright, trademark, licensing, or commercial rights to any text, character, plotline, or fanwork indexed on this site.
          </p>
          <p>
            OurArchive functions strictly as an emergency directory and read-only proxy for view-only cloud drive backups that community volunteers or authors have made available.
          </p>
        </section>

        {/* Pillar 2 */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              2. Zero-Download Architecture & Ephemeral Streaming
            </h2>
          </div>
          <p>
            OurArchive strictly enforces a <strong>Zero-Download / Zero-Local-Storage</strong> rule across all infrastructure:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>No Permanent Hosting:</strong> The platform does not host, duplicate, or save drive files (`.pdf`, `.html`, `.docx`) on its serverless disks or cloud object buckets.
            </li>
            <li>
              <strong>Ephemeral Streaming:</strong> Works are rendered on-the-fly in an ephemeral, memory-only reader sandbox with script-stripping sanitization.
            </li>
            <li>
              <strong>Read-Only Verification:</strong> All links submitted are programmatically inspected to ensure public edit permissions are disabled.
            </li>
          </ul>
        </section>

        {/* Pillar 3 */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              3. Transformative Non-Commercial Fair Use
            </h2>
          </div>
          <p>
            OurArchive is strictly non-commercial:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>We do not run advertisements, affiliate links, or promotional sponsorships.</li>
            <li>We do not solicit, accept, or process monetary donations.</li>
            <li>We do not sell, rent, or monetize reader or contributor telemetry data.</li>
            <li>All infrastructure runs on community-tier serverless services purely for the benefit of fans and readers during outages.</li>
          </ul>
        </section>

        {/* Pillar 4 */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              4. Drive Owner Transparency & Privacy Protection
            </h2>
          </div>
          <p>
            Users who share view-only cloud drive backups are protected with privacy safeguards:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Email Masking:</strong> Drive owner email addresses are masked by default (e.g., `vo***@gmail.com`) to prevent scraper harvesting.
            </li>
            <li>
              <strong>Masked URLs:</strong> Raw cloud drive URLs are masked behind user-initiated reveal modals protected by edge rate limits.
            </li>
            <li>
              <strong>Permission Safety:</strong> Any link with public edit permissions enabled is automatically quarantined.
            </li>
          </ul>
        </section>

        {/* Pillar 5: Immediate Takedown Guarantee */}
        <section className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <h2 className="text-base font-bold text-brand-bark dark:text-brand-light">
              5. The Immediate Takedown Guarantee
            </h2>
          </div>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            If you are an author, cloud drive owner, copyright holder, or contributor and you want your work removed from OurArchive:
          </p>
          <blockquote className="border-l-4 border-brand-trunk pl-4 py-1 text-brand-bark dark:text-brand-light font-semibold italic text-sm">
            &ldquo;You only have to reach out, and the administrator will remove it immediately.&rdquo;
          </blockquote>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>Zero Bureaucracy:</strong> Formal legal notices or notarized claims are not required.</li>
            <li><strong>Zero Resistance:</strong> We do not contest, debate, or delay author removal requests.</li>
            <li><strong>Immediate Action:</strong> Visibility is instantly suppressed, and all cascading database records are purged.</li>
          </ul>
          <div className="pt-2">
            <Link
              href="/takedown"
              className="inline-block px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white rounded font-bold transition shadow-xs"
            >
              Go to Immediate Takedown Request Portal &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="border-t border-border-light dark:border-border-dark pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-gray-500 dark:text-gray-400">
        <span>OurArchive Community Safety &amp; Governance</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="hover:underline">
            Home Index
          </Link>
          <Link href="/takedown" className="hover:underline">
            Takedown Policy
          </Link>
          <Link href="/api/health" className="hover:underline" target="_blank">
            System Telemetry
          </Link>
        </div>
      </div>
    </div>
  );
}
