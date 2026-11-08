import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TAKEDOWN_EMAIL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-border-light dark:border-border-dark py-8 px-4 text-xs bg-surface-light dark:bg-surface-dark transition-colors duration-150">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Grid: Disclaimers, About Dev, Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Disclaimers */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]">
              Emergency Disclaimers
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
              OurArchive is an emergency, temporary measure to aid fanfiction readers and authors during service disruptions. It operates under strict zero-download, read-only principles.
            </p>
            <div>
              <Link
                href="/disclaimers"
                className="text-brand-trunk dark:text-brand-light hover:underline font-medium text-[11px]"
              >
                Read full community disclaimers & creator charter &rarr;
              </Link>
            </div>
          </div>

          {/* Section 2: About Developer */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-[11px]">
              About The Developer
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
              Built with open-source care by a fanfiction enthusiast and developer to keep community stories readable when main servers are offline.
            </p>
            <div>
              <Link
                href="/about-developer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-800 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark font-medium transition text-[11px]"
              >
                <span>About Developer & Platform Architecture</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Section 3: Contact & Takedowns */}
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
                <a
                  href={`mailto:${TAKEDOWN_EMAIL}`}
                  className="text-brand-trunk dark:text-brand-light hover:underline font-mono"
                >
                  {TAKEDOWN_EMAIL}
                </a>
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
              &copy; {new Date().getFullYear()} OurArchive. Non-commercial, zero-download fanwork streaming index.
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
    </footer>
  );
}
