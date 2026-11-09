"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ThemeToggle } from "./ThemeToggle";
import { AuthModal } from "@/components/auth/AuthModal";
import { signOutUser } from "@/lib/services/auth";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | "guest">("guest");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    function updateUserInfo(usr: User | null) {
      setUser(usr);
      if (!usr) {
        setRole("guest");
        return;
      }
      const userMetaRole = (usr.app_metadata as Record<string, unknown> | undefined)?.role as UserRole | undefined;
      if (userMetaRole) {
        setRole(userMetaRole);
      } else {
        setRole("contributor");
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      updateUserInfo(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserInfo(session?.user ?? null);
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

  async function handleSignOut() {
    try {
      await signOutUser();
      setDrawerOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }

  const isVerifier = role === "verifier";
  const isAdmin = role === "admin";
  const isSignedIn = !!user && role !== "guest";

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Archivist";

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

          {/* Conditional Center/Desktop Navigation: Only rendered when user is a GUEST */}
          {!isSignedIn && (
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
            </nav>
          )}

          {/* Right Controls */}
          {isSignedIn ? (
            /* When Signed In: Render ONLY the 3 Lines (☰) hamburger button */
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 rounded-lg text-white hover:bg-brand-bark transition cursor-pointer flex items-center gap-1.5"
                aria-label="Open profile navigation drawer"
                aria-expanded={drawerOpen}
              >
                <span className="sr-only">Menu</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          ) : (
            /* When Signed Out (Guest): Render ThemeToggle, Sign In button, and 3-lines on mobile */
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1 text-xs font-semibold bg-white text-brand-trunk hover:bg-amber-50 rounded shadow-xs transition"
              >
                Sign In
              </button>
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
          )}
        </div>
      </header>

      {/* Off-Canvas Drawer (Portaled to body with z-[9999]) */}
      {drawerOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-surface-light dark:bg-surface-dark shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200 border-l border-border-light dark:border-border-dark">
            <div className="overflow-y-auto">
              {/* Drawer Top Header */}
              {isSignedIn ? (
                /* PROFILE Section instead of OurArchive Logo */
                <div className="bg-brand-trunk text-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 hover:opacity-90 transition group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-lg font-bold shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-mono tracking-wider text-amber-200">
                          Active Profile
                        </div>
                        <div className="font-bold text-sm truncate max-w-[170px] text-white group-hover:text-amber-100">
                          {displayName}
                        </div>
                        <span className="inline-block mt-0.5 text-[9px] bg-brand-bark text-amber-200 px-1.5 py-0.2 rounded uppercase border border-brand-amber font-mono">
                          {role}
                        </span>
                      </div>
                    </Link>

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
                </div>
              ) : (
                /* Guest Drawer Header */
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
              )}

              {/* Theme Mode Toggle (Right below Profile header) */}
              <div className="p-3 bg-subtle-light dark:bg-subtle-dark border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Theme (Light / Night)
                </span>
                <ThemeToggle />
              </div>

              {/* Navigation Items List */}
              <div className="p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Navigations
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

                {isSignedIn && (
                  <Link
                    href="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                  >
                    <span className="text-base">👤</span>
                    <span>My Profile</span>
                  </Link>
                )}

                {/* Verifier Section: Rendered only for Verifiers */}
                {isVerifier && (
                  <div className="pt-2 border-t border-border-light dark:border-border-dark mt-2">
                    <Link
                      href="/manage"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition"
                    >
                      <span className="text-base">🛡️</span>
                      <span>Manage (Verifier Workspace)</span>
                    </Link>
                  </div>
                )}

                {/* Administration Section: Strictly rendered for Admin only */}
                {isAdmin && (
                  <div className="pt-2 border-t border-border-light dark:border-border-dark mt-2">
                    <Link
                      href="/admin"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-brand-trunk dark:text-brand-light bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition"
                    >
                      <span className="text-base">🛡️</span>
                      <span>Manage Archive (Admin)</span>
                    </Link>
                  </div>
                )}

                <div className="pt-2 border-t border-border-light dark:border-border-dark mt-2">
                  <Link
                    href="/disclaimers"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                  >
                    <span className="text-base">⚖️</span>
                    <span>Disclaimers & Charter</span>
                  </Link>

                  <Link
                    href="/takedown"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    <span className="text-base">🚨</span>
                    <span>Immediate Takedown</span>
                  </Link>

                  <Link
                    href="/about-developer"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-subtle-light dark:hover:bg-subtle-dark transition"
                  >
                    <span className="text-base">📖</span>
                    <span>About Developer</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Bar: Sign Out button at the VERY BOTTOM */}
            <div className="p-4 border-t border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🔑</span>
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Auth Modal (Portaled) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
