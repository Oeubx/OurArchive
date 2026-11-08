"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "@/components/auth/UserNav";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [role, setRole] = useState<UserRole | "guest">("guest");

  useEffect(() => {
    const supabase = createClient();

    function determineRole(user: User | null) {
      if (!user) {
        setRole("guest");
        return;
      }
      const userMetaRole = (user.app_metadata as Record<string, unknown> | undefined)?.role as UserRole | undefined;
      if (userMetaRole) {
        setRole(userMetaRole);
      } else {
        setRole("contributor");
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      determineRole(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      determineRole(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const isVerifier = role === "verifier";
  const isAdmin = role === "admin";

  return (
    <>
      <header className="bg-brand-trunk text-white py-2.5 px-4 shadow-sm sticky top-0 z-40 transition-colors duration-150">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight hover:opacity-90 flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden bg-white/10 ring-1 ring-white/30 shrink-0 shadow-xs relative">
                <Image
                  src="/images/ourarchive-logo.jpg"
                  alt="OurArchive Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="font-bold tracking-tight">OurArchive</span>
            </Link>
          </div>

          {/* Center/Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-amber-100/90">
            <Link href="/" className="hover:text-white transition py-1">
              Home
            </Link>
            <span>•</span>
            <Link href="/search" className="hover:text-white transition py-1">
              Search
            </Link>
            <span>•</span>
            <Link href="/contribute" className="hover:text-white transition py-1">
              Contribute
            </Link>
            <span>•</span>
            <Link href="/disclaimers" className="hover:text-white transition py-1">
              Disclaimers
            </Link>

            {/* Manage Link: Gated strictly for Verifier (/manage) and Admin (/admin). Hidden for Contributors and Guests */}
            {isVerifier && (
              <>
                <span>•</span>
                <Link
                  href="/manage"
                  className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold hover:bg-emerald-600 transition flex items-center gap-1 shadow-xs"
                >
                  <span>🛡️</span> Manage
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <span>•</span>
                <Link
                  href="/admin"
                  className="px-2 py-0.5 rounded bg-amber-200 text-brand-bark font-bold hover:bg-amber-100 transition flex items-center gap-1 shadow-xs"
                >
                  <span>🛡️</span> Manage
                </Link>
              </>
            )}
          </nav>

          {/* Right Controls: Theme Toggle, UserNav & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <UserNav />

            {/* Mobile Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-brand-bark transition"
              aria-label="Open mobile navigation"
              aria-expanded={drawerOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-surface-light dark:bg-surface-dark shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="bg-brand-trunk text-white p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded overflow-hidden bg-white/20 shrink-0 relative">
                    <Image
                      src="/images/ourarchive-logo.jpg"
                      alt="OurArchive Emblem"
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">OurArchive</div>
                  </div>
                </div>

                {/* Close Drawer Button */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded text-amber-100 hover:text-white hover:bg-brand-bark transition"
                  aria-label="Close navigation drawer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Items List */}
              <div className="p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Navigation
                </div>

                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                >
                  <span className="text-base">🏠</span>
                  <span>Home Index</span>
                </Link>

                <Link
                  href="/search"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                >
                  <span className="text-base">🔍</span>
                  <span>Search Archive</span>
                </Link>

                <Link
                  href="/contribute"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                >
                  <span className="text-base">➕</span>
                  <span>Contribute Link</span>
                </Link>

                <Link
                  href="/disclaimers"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                >
                  <span className="text-base">⚖️</span>
                  <span>Disclaimers & Charter</span>
                </Link>

                <Link
                  href="/about-developer"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                >
                  <span className="text-base">📖</span>
                  <span>About Developer</span>
                </Link>

                {/* Verifier Section: Rendered only for Verifiers */}
                {isVerifier && (
                  <div className="pt-3 border-t border-border-light dark:border-border-dark mt-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>Verification</span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded font-mono">
                        VERIFIER
                      </span>
                    </div>

                    <Link
                      href="/manage"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition mt-1"
                    >
                      <span className="text-base">🛡️</span>
                      <span>Manage (Verifier Workspace)</span>
                    </Link>
                  </div>
                )}

                {/* Administration Section: Strictly rendered for Admin only */}
                {isAdmin && (
                  <div className="pt-3 border-t border-border-light dark:border-border-dark mt-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                      <span>Administration</span>
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded font-mono">
                        ADMIN ONLY
                      </span>
                    </div>

                    <Link
                      href="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-brand-trunk dark:text-brand-light bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition mt-1"
                    >
                      <span className="text-base">🛡️</span>
                      <span>Manage Archive (Admin)</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Bar: Theme info and Notice */}
            <div className="p-4 border-t border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Theme Mode:</span>
                <ThemeToggle />
              </div>
              <div className="text-[10px] leading-tight opacity-75">
                OurArchive is a non-commercial, zero-download community reading directory.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
