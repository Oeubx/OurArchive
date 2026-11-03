import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { UserNav } from "@/components/auth/UserNav";
import { EmergencyNoticeBanner } from "@/components/disclaimers/EmergencyNoticeBanner";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 antialiased transition-colors duration-150">
        <ThemeProvider>
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
              <div className="flex items-center gap-3">
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
                <ThemeToggle />
                <UserNav />
              </div>
            </div>
          </header>

          {/* Global Emergency Notice Banner */}
          <EmergencyNoticeBanner />

          <main className="flex-1 max-w-6xl mx-auto w-full p-4">
            {children}
          </main>

          <footer className="border-t border-border-light dark:border-border-dark py-6 px-4 text-xs text-gray-500 dark:text-gray-400 bg-surface-light dark:bg-surface-dark transition-colors duration-150">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-semibold text-gray-700 dark:text-gray-200">
                  OurArchive — Temporary Emergency Fanwork Index & Read-Only Reader
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Zero-Download streaming architecture. Fanworks remain the 100% intellectual property of their original creators.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <Link href="/" className="hover:underline text-gray-600 dark:text-gray-300">
                  Home Index
                </Link>
                <Link href="/disclaimers" className="hover:underline text-gray-600 dark:text-gray-300">
                  Community Charter
                </Link>
                <Link href="/takedown" className="hover:underline text-ao3-red font-semibold">
                  Immediate Takedown
                </Link>
                <Link href="/api/health" className="hover:underline text-gray-600 dark:text-gray-300" target="_blank">
                  Status
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
