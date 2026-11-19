import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About — OurArchive",
  description:
    "Learn about the architecture, principles, and design behind this zero-download cloud drive directory and read-only viewer.",
};

export default function AboutDeveloperPage() {
  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="space-y-2 border-b border-border-light dark:border-border-dark pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">Home</Link> &rarr; <span>About</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          About the Platform &amp; Architecture
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          How this zero-download cloud drive compilation and read-only viewer works, and our commitment to creator sovereignty.
        </p>
      </div>

      <AboutContent />
    </div>
  );
}
