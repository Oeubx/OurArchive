import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Disclaimers & Governance Charter — OurArchive",
  description:
    "Legal notices, creator rights, transformative fair use, and solidarity with Archive of Our Own (AO3) and the Organization for Transformative Works (OTW).",
};

export default function DisclaimersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-xs text-gray-800 leading-relaxed">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-ao3-red hover:underline font-medium">
            &larr; Back to Library Index
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          OurArchive Community Disclaimers & Governance Charter
        </h1>
        <p className="text-gray-500 mt-1">
          Last Updated: November 2026 • Module 3 Safety & Compliance Specification
        </p>
      </div>

      {/* Emergency Scope Box */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r text-amber-950 space-y-1">
        <h2 className="font-bold text-sm text-amber-900">
          Emergency Platform Scope & Solidarity with AO3 / OTW
        </h2>
        <p>
          <strong>OurArchive</strong> was created as an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages. It is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).
        </p>
      </div>

      {/* Core Governance Pillars */}
      <div className="space-y-6">
        {/* Pillar 1 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">✍️</span>
            <h2 className="text-base font-bold text-gray-900">
              1. Respect for Fanfiction Creator Sovereignty
            </h2>
          </div>
          <p>
            Fanfiction authors retain <strong>100% intellectual and moral ownership</strong> over their works. OurArchive does not claim any copyright, trademark, licensing, or commercial rights to any text, character, plotline, or fanwork indexed on this site.
          </p>
          <p>
            OurArchive functions strictly as an emergency directory and read-only proxy for view-only Google Drive backups that community volunteers or authors have made available.
          </p>
        </section>

        {/* Pillar 2 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h2 className="text-base font-bold text-gray-900">
              2. Zero-Download Architecture & Ephemeral Streaming
            </h2>
          </div>
          <p>
            OurArchive strictly enforces a <strong>Zero-Download / Zero-Local-Storage</strong> rule across all infrastructure:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>
              <strong>No Permanent Hosting:</strong> The platform does not host, duplicate, or save Google Drive files (`.pdf`, `.html`, `.docx`) on its serverless disks or cloud object buckets.
            </li>
            <li>
              <strong>Ephemeral Streaming:</strong> Works are rendered on-the-fly in an ephemeral, memory-only reader sandbox with script-stripping sanitization (via DOMPurify).
            </li>
            <li>
              <strong>Read-Only Verification:</strong> All links submitted are programmatically inspected to ensure public edit permissions are disabled.
            </li>
          </ul>
        </section>

        {/* Pillar 3 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <h2 className="text-base font-bold text-gray-900">
              3. Transformative Non-Commercial Fair Use
            </h2>
          </div>
          <p>
            OurArchive is strictly non-commercial:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>We do not run advertisements, affiliate links, or promotional sponsorships.</li>
            <li>We do not solicit, accept, or process monetary donations.</li>
            <li>We do not sell, rent, or monetize reader or contributor telemetry data.</li>
            <li>All infrastructure runs on community-tier serverless services purely for the benefit of fans and readers during outages.</li>
          </ul>
        </section>

        {/* Pillar 4 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <h2 className="text-base font-bold text-gray-900">
              4. Drive Owner Transparency & Privacy Protection
            </h2>
          </div>
          <p>
            Users who share view-only Google Drive backups are protected with privacy safeguards:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>
              <strong>Email Masking:</strong> Drive owner email addresses are masked by default (e.g., `vo***@gmail.com`) to prevent scraper harvesting.
            </li>
            <li>
              <strong>Masked URLs:</strong> Raw Google Drive URLs are masked behind user-initiated reveal modals protected by edge rate limits.
            </li>
            <li>
              <strong>Permission Safety:</strong> Any link with public edit permissions enabled is automatically quarantined.
            </li>
          </ul>
        </section>

        {/* Pillar 5: Immediate Takedown Guarantee */}
        <section className="bg-red-50/70 border border-red-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <h2 className="text-base font-bold text-red-950">
              5. The Immediate Takedown Guarantee
            </h2>
          </div>
          <p className="text-red-900 leading-relaxed">
            If you are an author, Google Drive owner, copyright holder, or contributor and you want your work removed from OurArchive:
          </p>
          <blockquote className="border-l-4 border-red-400 pl-4 py-1 text-red-950 font-semibold italic text-sm">
            &ldquo;You only have to reach out, and the administrator will remove it immediately.&rdquo;
          </blockquote>
          <ul className="list-disc pl-5 space-y-1 text-red-900">
            <li><strong>Zero Bureaucracy:</strong> Formal legal notices or notarized claims are not required.</li>
            <li><strong>Zero Resistance:</strong> We do not contest, debate, or delay author removal requests.</li>
            <li><strong>Immediate Action:</strong> Visibility is instantly suppressed, and all cascading database records are purged.</li>
          </ul>
          <div className="pt-2">
            <Link
              href="/takedown"
              className="inline-block px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white rounded font-bold transition shadow-xs"
            >
              Go to Immediate Takedown Request Portal &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-gray-500">
        <span>OurArchive Community Safety & Governance</span>
        <div className="flex items-center gap-4">
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
