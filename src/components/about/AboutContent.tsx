"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TAKEDOWN_EMAIL } from "@/lib/config";
import { DirectTakedownEmailModal } from "@/components/takedown/DirectTakedownEmailModal";

export function AboutContent() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  return (
    <div className="space-y-6">
      {/* Origin Story & Mission */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-4 shadow-xs">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📖 The Origin Story</span>
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Hello! I am an on-call data encoder, a software developer, and a fellow fanfiction reader.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            The idea behind OurArchive started quite simply: I was lazing around one afternoon while my girlfriend was whining about a major fanfic platform experiencing downtime and being completely unable to read her comfort stories.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            To cheer her up and solve her immediate dilemma, I sat down and started planning a lightweight system just for her, turning her local storage and saved drive compilation of backup stories into a safe, organized way to read online without the clutter of spreadsheets or the risks of downloading raw files.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Since this seemed like a genuinely good idea and an exciting technical challenge, I decided to take the leap and turn it into a full-blown system for the entire reading community: <strong>OurArchive</strong>.
          </p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-canvas-light dark:bg-canvas-dark p-3.5 rounded border border-border-light dark:border-border-dark">
          <strong>OurArchive</strong> solves this exact problem: compile author-approved cloud drive links into a single searchable index, provide a distraction-free online reader, and protect readers through metadata verification.
        </p>
      </section>

      {/* Core Principles */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2 shadow-xs">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🛡️ 100% Creator Sovereignty</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Fanfiction authors own all rights to their stories. OurArchive makes no intellectual property claims, never monetizes works, and takes action on removal requests within 24 hours with no questions asked.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2 shadow-xs">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🚫 Zero-Download Architecture</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Our platform does not download or store copies of drive files on our servers. The text is streamed temporarily in memory through cloud export APIs into a clean, view-only reader.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2 shadow-xs">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>🤝 Community Solidarity</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            We are an emergency, temporary measure designed to support community reading continuity without competing with or replacing primary creator platforms.
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-2 shadow-xs">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
            <span>👁️ Gentle, Accessible UI</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Designed with non-glare warm off-white parchment tones and high-contrast obsidian dark mode so readers can enjoy reading comfortably for hours without eye strain.
          </p>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 space-y-3 shadow-xs">
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
      <section className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-lg p-6 space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-brand-bark dark:text-brand-light flex items-center gap-2">
          <span>📬 Author Takedown & Direct Reach-Out</span>
        </h2>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          If you are a writer and see your story mirrored here that you wish removed, please email us directly or submit a takedown request. Action will be taken within the next 24 hours of receiving your takedown request.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded shadow-xs transition"
          >
            Copy Takedown Email: {TAKEDOWN_EMAIL}
          </button>
          <Link
            href="/takedown"
            className="px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 text-xs font-semibold rounded hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
          >
            Open Takedown Form
          </Link>
          <Link
            href="/disclaimers"
            className="text-xs text-brand-trunk dark:text-brand-light underline font-medium"
          >
            Read Legal Disclaimers
          </Link>
        </div>
      </section>

      <DirectTakedownEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}
