/**
 * Global Platform Configuration
 */

export const TAKEDOWN_EMAIL =
  process.env.NEXT_PUBLIC_TAKEDOWN_EMAIL || "takedown-ourarchive@proton.me";

export const DEV_CONNECT = {
  personalEmail: process.env.NEXT_PUBLIC_DEV_EMAIL || "",
  twitterX: process.env.NEXT_PUBLIC_DEV_TWITTER || "",
  github: process.env.NEXT_PUBLIC_DEV_GITHUB || "https://github.com/Oeubx",
  linkedIn: process.env.NEXT_PUBLIC_DEV_LINKEDIN || "",
  portfolio: process.env.NEXT_PUBLIC_DEV_PORTFOLIO || "under-development",
};
