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

      {/* Temporary Project Scope Box */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-600 rounded-r text-gray-800 dark:text-gray-200 space-y-1">
        <h2 className="font-bold text-sm text-brand-bark dark:text-brand-light">
          Temporary Project Scope & Community Charter
        </h2>
        <p>
          <strong>OurArchive</strong> was created as a temporary project to aid fanfiction readers and authors during service disruptions. It is strictly not intended to replace, compete with, or replicate permanent operations of primary fanwork archives.
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
              2. Zero-Download Architecture &amp; Live View-Only Streaming
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
              <strong>Temporary View-Only Streaming:</strong> Works are rendered on-the-fly in a temporary, memory-only viewer with script-stripping safety checks.
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
            <li><strong>Prompt Action:</strong> The listing is hidden right away, and all related database records are permanently deleted within 24 hours.</li>
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

        {/* Pillar 6: AI Usage & Deterministic Safety Verification */}
        <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              6. Our Policy on Artificial Intelligence (AI) &amp; How Verification Works
            </h2>
          </div>
          <p>
            We believe in complete transparency with the fanfiction community regarding how OurArchive was made and how it operates:
          </p>

          <div className="space-y-3 pl-1 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
                <span>👤</span>
                <span>Who Built OurArchive?</span>
              </h3>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  <strong>Human Planning &amp; Vision:</strong> This entire system—its purpose, design, creator safety protections, and zero-download rules—was <strong>planned and directed by the developer (<span className="font-mono">Oeubx</span>)</strong>.
                </li>
                <li>
                  <strong>AI as a Coding Assistant:</strong> The code was constructed using Google&apos;s <strong>Antigravity</strong> tool powered by the <strong>Gemini 3.8 Flash</strong> model. The AI acted purely as a software engineering helper (writing code, styling pages, and setting up database queries) under the developer&apos;s supervision.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
                <span>🚫</span>
                <span>Does AI Run on the Live Website or Read Fanworks?</span>
              </h3>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  <strong>Zero AI on the Live Site:</strong> The active website and server run on <strong>standard website code without any AI running in the background</strong>.
                </li>
                <li>
                  <strong>The AI Never Reads Your Stories:</strong> No artificial intelligence model has access to, ingests, or will <strong>ever read, analyze, summarize, or train on</strong> any fanfiction submitted or mirrored here. Your creative works remain 100% yours and are never fed into any machine learning models.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
                <span>🔍</span>
                <span>How Does Safety Verification Work? (No AI Involved)</span>
              </h3>
              <p className="mt-1">
                When a link is submitted, OurArchive performs basic safety checks to ensure the link is safe and view-only. <strong>This process does not use AI:</strong>
              </p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>
                  <strong>We only check the file label and format:</strong> The system asks Google Drive for basic details: the file name, file size, and file type (such as PDF or Word document).
                </li>
                <li>
                  <strong>Rule-based safety filter:</strong> A simple system filter checks that the file is not a harmful computer program (like <code className="font-mono text-[11px] bg-subtle-light dark:bg-subtle-dark px-1 py-0.5 rounded">.exe</code>, <code className="font-mono text-[11px] bg-subtle-light dark:bg-subtle-dark px-1 py-0.5 rounded">.bat</code>, or installer scripts).
                </li>
                <li>
                  <strong>No AI reads the story body text:</strong> The verification scanner does not read, analyze, summarize, or train on story text.
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
                <span>📑</span>
                <span>First-Page Catalog Metadata Scanning (Deterministic, Zero AI)</span>
              </h3>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  <strong>Cover Page Only:</strong> When requested during link contribution or verification, the system ephemerally inspects only the first cover/title page of a fanwork to extract public catalog details (Title, Rating, Category, Fandom, Warnings, Characters, and Tags).
                </li>
                <li>
                  <strong>Zero AI / Pure Deterministic Code:</strong> This scanning uses standard regular expressions and pattern matching—it does not use artificial intelligence, machine learning, or large language models.
                </li>
                <li>
                  <strong>Story Chapters Are Never Read:</strong> The system never reads, analyzes, summarizes, or trains on story chapters or body text. All extracted tags are stored solely to help readers find works in library search.
                </li>
              </ul>
            </div>
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
