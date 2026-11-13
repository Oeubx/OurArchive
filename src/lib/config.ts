/**
 * Global Platform Configuration
 */

export const APP_VERSION = "1.0.1";

export const TAKEDOWN_EMAIL =
  process.env.NEXT_PUBLIC_TAKEDOWN_EMAIL || "takedown-ourarchive@proton.me";

export const PROJECT_REPO =
  process.env.NEXT_PUBLIC_PROJECT_REPO || "https://github.com/Oeubx/OurArchive";

export const DEV_CONNECT = {
  personalEmail: process.env.NEXT_PUBLIC_DEV_EMAIL || "",
  twitterX: process.env.NEXT_PUBLIC_DEV_TWITTER || "",
  github: process.env.NEXT_PUBLIC_DEV_GITHUB || "https://github.com/Oeubx",
  repository: process.env.NEXT_PUBLIC_PROJECT_REPO || "https://github.com/Oeubx/OurArchive",
  linkedIn: process.env.NEXT_PUBLIC_DEV_LINKEDIN || "",
  portfolio: process.env.NEXT_PUBLIC_DEV_PORTFOLIO || "under-development",
};

/**
 * Validates whether a provided URL string is an active, reachable web URL
 * rather than a placeholder such as "under-development", "Under Development", or empty.
 */
export function isLiveUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed === "under-development" ||
    trimmed === "under development" ||
    trimmed === "under_development" ||
    trimmed === "none" ||
    trimmed === "n/a" ||
    trimmed === ""
  ) {
    return false;
  }
  return /^https?:\/\/[a-z0-9]/i.test(trimmed);
}
