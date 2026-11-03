import React from "react";
import Link from "next/link";

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
              OurArchive is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of AO3 or the OTW.
            </p>
            <div>
              <Link
                href="/disclaimers"
                className="text-ao3-red dark:text-ao3-lightred hover:underline font-medium text-[11px]"
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
                  href="mailto:ourarchive.aid@gmail.com"
                  className="text-ao3-red dark:text-ao3-lightred hover:underline font-mono"
                >
                  ourarchive.aid@gmail.com
                </a>
              </div>
              <div>
                <Link
                  href="/takedown"
                  className="text-ao3-red dark:text-ao3-lightred hover:underline font-semibold"
                >
                  Fast-Track Takedown Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Footer Bar */}
        <div className="border-t border-border-light dark:border-border-dark pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 dark:text-gray-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} OurArchive. Non-commercial, zero-download fanwork streaming index.
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
            <Link href="/takedown" className="hover:underline text-ao3-red dark:text-ao3-lightred font-medium">
              Takedown
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
