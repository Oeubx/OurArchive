import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmergencyNoticeBanner } from "@/components/disclaimers/EmergencyNoticeBanner";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "OurArchive — Cloud Drive Directory & Read-Only Viewer",
  description:
    "A zero-download, read-only cloud drive index and document streaming platform.",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem("ourarchive_theme");
    var isDark = stored === "dark" || (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (window.location.pathname.indexOf("/reader/") === 0) {
      root.style.backgroundColor = isDark ? "#121214" : (stored === "warm" || stored === "sepia") ? "#f7edd5" : "#f8f9fa";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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
