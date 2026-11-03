"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "@/components/auth/UserNav";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check role from Supabase auth and local dev override
    const supabase = createClient();

    function checkAdminRole(user: User | null) {
      const devRole = typeof window !== "undefined" ? localStorage.getItem("ourarchive_dev_role") : null;
      if (devRole === "admin") {
        setIsAdmin(true);
        return;
      }
      const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
      setIsAdmin(role === "admin");
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      checkAdminRole(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminRole(session?.user ?? null);
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

  return (
    <>
      <header className="bg-ao3-red text-white py-2.5 px-4 shadow-sm sticky top-0 z-40">
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
            <span className="hidden sm:inline-block text-[11px] font-medium bg-ao3-darkred px-2 py-0.5 rounded text-amber-200 border border-red-800">
              Emergency Service
            </span>
          </div>

          {/* Center/Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-red-100">
            <Link href="/" className="hover:text-white transition py-1">
              Home
            </Link>
            <span>•</span>
            <Link href="/#search" className="hover:text-white transition py-1">
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

            {/* Manage Link: Strictly rendered only for authenticated Admins */}
            {isAdmin && (
              <>
                <span>•</span>
                <Link
                  href="/admin"
                  className="px-2 py-0.5 rounded bg-amber-400 text-ao3-darkred font-bold hover:bg-amber-300 transition flex items-center gap-1 shadow-xs"
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
              className="md:hidden p-1.5 rounded-md text-red-100 hover:text-white hover:bg-ao3-darkred transition flex items-center justify-center"
              aria-label="Open mobile navigation drawer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Mobile Navigation Drawer (from screen recording interaction) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Darkened Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Left Slide-Over Drawer Container */}
          <div className="relative w-72 max-w-[85vw] bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark text-gray-900 dark:text-gray-100 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div>
              <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-ao3-red text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded overflow-hidden bg-white/10 ring-1 ring-white/30 shrink-0 relative">
                    <Image
                      src="/images/ourarchive-logo.jpg"
                      alt="OurArchive Logo"
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight">OurArchive</div>
                    <div className="text-[10px] text-amber-200">Emergency Service</div>
                  </div>
                </div>

                {/* Close Drawer Button */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded text-red-100 hover:text-white hover:bg-ao3-darkred transition"
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
                  href="/#search"
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-ao3-red dark:text-ao3-lightred bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition mt-1"
                    >
                      <span className="text-base">🛡️</span>
                      <span>Manage Archive</span>
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
                OurArchive is a temporary emergency reading aid during AO3 downtime.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
