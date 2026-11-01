import type { Metadata } from "next";
import "./globals.css";

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
        <header className="bg-ao3-red text-white py-2 px-4 shadow">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight">OurArchive</span>
              <span className="ml-2 text-xs bg-ao3-darkred px-2 py-0.5 rounded text-amber-200">
                Emergency Service
              </span>
            </div>
            <div className="text-xs text-red-100">
              Read-Only • Zero-Download • Temporary Bridge
            </div>
          </div>
        </header>

        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs text-center">
          <strong>Community Notice:</strong> OurArchive is a temporary emergency measure during AO3 outages and does not replace or compete with Archive of Our Own or the OTW.
        </div>

        <main className="flex-1 max-w-6xl mx-auto w-full p-4">
          {children}
        </main>

        <footer className="border-t border-gray-200 py-4 px-4 text-center text-xs text-gray-500 bg-gray-50">
          <p>
            Zero-Download Fanfiction Index & Streaming Reader. Works remain the sole property of their respective creators.
          </p>
        </footer>
      </body>
    </html>
  );
}
