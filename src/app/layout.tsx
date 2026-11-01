import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { UserNav } from "@/components/auth/UserNav";
import { EmergencyNoticeBanner } from "@/components/disclaimers/EmergencyNoticeBanner";

export const metadata: Metadata = {
  title: "OurArchive — Emergency Read-Only Platform for AO3 Users",
  description:
    "An emergency, non-commercial temporary bridge for the fanfiction community during Archive of Our Own (AO3) outages. Zero-download, read-only streaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <header className="bg-ao3-red text-white py-2.5 px-4 shadow">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90">
                OurArchive
              </Link>
              <span className="text-xs bg-ao3-darkred px-2 py-0.5 rounded text-amber-200">
                Emergency Service
              </span>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-3 text-xs text-red-100 font-medium">
                <Link href="/" className="hover:text-white transition">
                  Index
                </Link>
                <span>•</span>
                <Link href="/disclaimers" className="hover:text-white transition">
                  Disclaimers
                </Link>
                <span>•</span>
                <Link href="/takedown" className="hover:text-white text-amber-200 transition">
                  Takedown
                </Link>
              </nav>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Global Emergency Notice Banner */}
        <EmergencyNoticeBanner />

        <main className="flex-1 max-w-6xl mx-auto w-full p-4">
          {children}
        </main>

        <footer className="border-t border-gray-200 py-6 px-4 text-xs text-gray-500 bg-gray-50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-gray-700">
                OurArchive — Temporary Emergency Fanwork Index & Read-Only Reader
              </p>
              <p className="text-[11px] text-gray-500">
                Zero-Download streaming architecture. Fanworks remain the 100% intellectual property of their original creators.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <Link href="/" className="hover:underline text-gray-600">
                Home Index
              </Link>
              <Link href="/disclaimers" className="hover:underline text-gray-600">
                Community Charter
              </Link>
              <Link href="/takedown" className="hover:underline text-ao3-red font-semibold">
                Immediate Takedown
              </Link>
              <Link href="/api/health" className="hover:underline text-gray-600" target="_blank">
                Status
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
