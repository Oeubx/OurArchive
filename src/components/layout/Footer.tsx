"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_VERSION, TAKEDOWN_EMAIL, DEV_CONNECT, isLiveUrl } from "@/lib/config";
import { DirectTakedownEmailModal } from "@/components/takedown/DirectTakedownEmailModal";

export function Footer() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  return (
    <footer className="border-t border-border-light dark:border-border-dark py-8 px-4 text-xs bg-surface-light dark:bg-surface-dark transition-colors duration-150">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Grid: Disclaimers, About Dev & Socials, Contact & Takedowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Disclaimers */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]">
              Platform Disclaimers
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
              OurArchive is a zero-download, read-only cloud drive directory and document viewer. All indexed content remains the property of its original creators.
            </p>
            <div>
              <Link
                href="/disclaimers"
                className="text-brand-trunk dark:text-brand-light hover:underline font-medium text-[11px]"
              >
                Read full disclaimers &amp; creator charter &rarr;
              </Link>
            </div>
          </div>

          {/* Section 2: About Platform & Reach-out Socials */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]">
              About The Platform
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
              Built as a lightweight, zero-download system for compiling, verifying, and reading shared cloud drive documents online.
            </p>
            <div>
              <Link
                href="/about-developer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-800 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark font-medium transition text-[11px]"
              >
                <span>About &amp; Platform Architecture</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {/* Socials & Connect */}
            <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Reach Out & Connect
              </span>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                {/* GitHub */}
                {DEV_CONNECT.github && (
                  <a
                    href={DEV_CONNECT.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-brand-trunk dark:hover:text-brand-light transition font-medium"
                    title="Developer GitHub Profile"
                  >
                    <span>🐙</span>
                    <span>GitHub</span>
                  </a>
                )}

                {/* X (Twitter) */}
                {DEV_CONNECT.twitterX && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <a
                      href={DEV_CONNECT.twitterX.startsWith("http") ? DEV_CONNECT.twitterX : `https://x.com/${DEV_CONNECT.twitterX.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-brand-trunk dark:hover:text-brand-light transition font-medium"
                      title="Developer X Profile"
                    >
                      <span>𝕏</span>
                      <span>X</span>
                    </a>
                  </>
                )}

                {/* LinkedIn */}
                {DEV_CONNECT.linkedIn && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <a
                      href={DEV_CONNECT.linkedIn.startsWith("http") ? DEV_CONNECT.linkedIn : `https://linkedin.com/in/${DEV_CONNECT.linkedIn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-brand-trunk dark:hover:text-brand-light transition font-medium"
                      title="Developer LinkedIn Profile"
                    >
                      <span>💼</span>
                      <span>LinkedIn</span>
                    </a>
                  </>
                )}

                {/* Personal Email */}
                {DEV_CONNECT.personalEmail && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <a
                      href={`mailto:${DEV_CONNECT.personalEmail}`}
                      className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-brand-trunk dark:hover:text-brand-light transition font-medium"
                      title="Send Personal Email"
                    >
                      <span>✉️</span>
                      <span>Email</span>
                    </a>
                  </>
                )}
              </div>

              {/* Portfolio Link / Under Development Status */}
              <div className="pt-0.5">
                {isLiveUrl(DEV_CONNECT.portfolio) ? (
                  <a
                    href={DEV_CONNECT.portfolio.startsWith("http") ? DEV_CONNECT.portfolio : `https://${DEV_CONNECT.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-trunk dark:text-brand-light hover:underline font-medium text-[11px]"
                  >
                    <span>🌐</span>
                    <span>Developer Portfolio &rarr;</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-canvas-light dark:bg-canvas-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark text-[10px]">
                    <span>🌐</span>
                    <span>Portfolio:</span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">Under Development</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Immediate Takedowns */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]">
              Contact & Immediate Takedowns
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
              Authors retain 100% sovereignty. If your work was linked without your consent, reach out and it will be removed immediately without debate.
            </p>
            <div className="flex flex-col gap-1 text-[11px]">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email: </span>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="text-brand-trunk dark:text-brand-light hover:underline font-mono text-left"
                >
                  {TAKEDOWN_EMAIL}
                </button>
              </div>
              <div>
                <Link
                  href="/takedown"
                  className="text-brand-trunk dark:text-brand-light hover:underline font-semibold"
                >
                  Fast-Track Takedown Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Footer Bar */}
        <div className="border-t border-border-light dark:border-border-dark pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 dark:text-gray-400 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-border-light dark:border-border-dark relative">
              <Image
                src="/images/ourarchive-logo.jpg"
                alt="OurArchive Emblem"
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </div>
            <span>
              &copy; {new Date().getFullYear()} OurArchive &middot; v{APP_VERSION}. Zero-download cloud drive directory &amp; viewer.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>•</span>
            <Link href="/about-developer" className="hover:underline">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimers" className="hover:underline">
              Disclaimers
            </Link>
            <span>•</span>
            <Link href="/takedown" className="hover:underline text-brand-trunk dark:text-brand-light font-medium">
              Takedown
            </Link>
          </div>
        </div>
      </div>

      <DirectTakedownEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </footer>
  );
}
