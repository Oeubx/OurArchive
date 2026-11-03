"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "@/components/auth/UserNav";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-ao3-red text-white py-2.5 px-4 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Emergency Tag */}
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
            <span>OurArchive</span>
          </Link>
          <span className="hidden sm:inline-block text-[11px] font-medium bg-ao3-darkred px-2 py-0.5 rounded text-amber-200 border border-red-800">
            Emergency Service
          </span>
        </div>

        {/* Desktop Navigation Links */}
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
          <Link href="/admin" className="hover:text-white transition py-1">
            Manage
          </Link>
          <span>•</span>
          <Link href="/disclaimers" className="hover:text-white transition py-1">
            Disclaimers
          </Link>
        </nav>

        {/* Right Action Cluster: Theme Toggle & UserNav */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserNav />

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-red-100 hover:text-white hover:bg-ao3-darkred transition"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-red-800 mt-2 text-xs space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-2 py-1.5 rounded hover:bg-ao3-darkred text-white"
          >
            Home
          </Link>
          <Link
            href="/#search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-2 py-1.5 rounded hover:bg-ao3-darkred text-white"
          >
            Search
          </Link>
          <Link
            href="/contribute"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-2 py-1.5 rounded hover:bg-ao3-darkred text-white"
          >
            Contribute
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-2 py-1.5 rounded hover:bg-ao3-darkred text-white"
          >
            Manage
          </Link>
          <Link
            href="/disclaimers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-2 py-1.5 rounded hover:bg-ao3-darkred text-white"
          >
            Disclaimers
          </Link>
        </div>
      )}
    </header>
  );
}
