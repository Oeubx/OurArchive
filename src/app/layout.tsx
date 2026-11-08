import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmergencyNoticeBanner } from "@/components/disclaimers/EmergencyNoticeBanner";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "OurArchive — Cloud Fanwork Directory & Read-Only Archive",
  description:
    "An emergency, non-commercial reading directory and cloud mirror index for the fanfiction community. Zero-download, read-only streaming.",
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
          <Header />

          {/* Global Emergency Notice Banner */}
          <EmergencyNoticeBanner />

          <main className="flex-1 max-w-6xl mx-auto w-full p-4">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
