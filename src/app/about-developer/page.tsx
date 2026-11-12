import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

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

      <AboutContent />
    </div>
  );
}
