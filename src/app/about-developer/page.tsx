import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Developer — OurArchive",
  description:
    "Learn about the mission, philosophy, and creator behind OurArchive's emergency fanfiction index and reader.",
};

export default function AboutDeveloperPage() {
  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="space-y-2 border-b border-border-light dark:border-border-dark pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">Home</Link> &rarr; <span>About Developer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          About the Developer & the OurArchive Initiative
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Why this emergency fanfiction platform was created, how it works, and our commitment to creators.
        </p>
      </div>

      {/* Origin Story & Mission */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📖 The Origin Story</span>
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Hello! I am a software developer and longtime fanfiction reader. When Archive of Our Own (AO3) experiences downtime—whether scheduled for database maintenance or unscheduled due to DDoS attacks and server overloads—millions of readers and writers across the globe suddenly lose access to the stories that offer them comfort, entertainment, and connection.
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          In response, readers and authors began organizing ad-hoc Google Drive links and spreadsheets across social media. However, finding specific fanworks across disorganized links was difficult, and clicking raw Drive links posed security questions.
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-canvas-light dark:bg-canvas-dark p-3.5 rounded border border-border-light dark:border-border-dark">
          <strong>OurArchive</strong> was conceived to solve this exact problem: compile author-approved Google Drive links into a single searchable index, provide a distraction-free online reader, and protect readers through metadata verification.
        </p>
      </section>

      {/* Core Principles */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🛡️ 100% Creator Sovereignty</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Fanfiction authors own all rights to their stories. OurArchive makes no intellectual property claims, never monetizes works, and honors instant removal requests with no questions asked.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🚫 Zero-Download Architecture</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Our platform does not download or store copies of Drive files on our servers. The text is rendered ephemerally through Google Docs export APIs into a clean viewer.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🤝 AO3 & OTW Solidarity</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            We are an emergency, temporary measure. We do not compete with, replace, or monetize what the Organization for Transformative Works has built over decades.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>👁️ Gentle, Accessible UI</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Designed with non-glare warm off-white parchment tones and high-contrast obsidian dark mode so readers can enjoy reading comfortably for hours without eye strain.
          </p>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          🛠️ Technology Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark text-center">
            <div className="font-semibold text-gray-800 dark:text-gray-200">Next.js 14</div>
            <div className="text-gray-500 text-[10px]">App Router & SSR</div>
          </div>
          <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark text-center">
            <div className="font-semibold text-gray-800 dark:text-gray-200">TypeScript</div>
            <div className="text-gray-500 text-[10px]">Strict Type Contracts</div>
          </div>
          <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark text-center">
            <div className="font-semibold text-gray-800 dark:text-gray-200">Tailwind CSS</div>
            <div className="text-gray-500 text-[10px]">Custom Palette Tokens</div>
          </div>
          <div className="p-3 bg-canvas-light dark:bg-canvas-dark rounded border border-border-light dark:border-border-dark text-center">
            <div className="font-semibold text-gray-800 dark:text-gray-200">Supabase</div>
            <div className="text-gray-500 text-[10px]">PostgreSQL & Auth</div>
          </div>
        </div>
      </section>

      {/* Direct Author Contact & Takedown Desk */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-6 space-y-3">
        <h2 className="text-base font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
          <span>📬 Author Takedown & Direct Reach-Out</span>
        </h2>
        <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          If you are a writer and see your story mirrored here that you wish removed, please email us directly with the link. We honor all requests immediately.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="mailto:ourarchive.aid@gmail.com"
            className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded shadow-sm transition"
          >
            Email: ourarchive.aid@gmail.com
          </a>
          <Link
            href="/takedown"
            className="px-4 py-2 bg-white dark:bg-surface-dark border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold rounded hover:bg-amber-100/50 transition"
          >
            Open Takedown Form
          </Link>
          <Link
            href="/disclaimers"
            className="text-xs text-amber-800 dark:text-amber-300 underline font-medium"
          >
            Read Legal Disclaimers
          </Link>
        </div>
      </section>
    </div>
  );
}
