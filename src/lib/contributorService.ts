import { DriveLink, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";

const STORAGE_KEY_CONTRIBUTIONS = "ourarchive_my_contributions";
const STORAGE_KEY_APPLICATIONS = "ourarchive_verifier_applications";

// Default initial contributions (empty by default; populated via Supabase / user submissions)
const DEFAULT_MY_CONTRIBUTIONS: DriveLink[] = [];

/**
 * Get all contributions submitted by the current user
 */
export function getMyContributions(): DriveLink[] {
  if (typeof window === "undefined") return DEFAULT_MY_CONTRIBUTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTRIBUTIONS);
    if (!raw) {
      return [];
    }
    const parsed: DriveLink[] = JSON.parse(raw);
    const cleaned = parsed.filter((l) => !l.id.startsWith("my-contrib-"));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_CONTRIBUTIONS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

/**
 * Add a new contribution submitted by the user
 */
export function addMyContribution(
  newLink: Omit<DriveLink, "id" | "uploadedAt" | "status" | "maskedDriveUrl" | "automatedRiskScore"> & {
    automatedRiskScore?: number;
  }
): DriveLink {
  const current = getMyContributions();
  const fullLink: DriveLink = {
    ...newLink,
    id: `contrib-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
    status: "under_verification",
    maskedDriveUrl: maskDriveUrl(newLink.rawDriveUrl),
    automatedRiskScore: 0,
  };

  const updated = [fullLink, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_CONTRIBUTIONS, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }
  return fullLink;
}

/**
 * Submit an application to become a verifier
 */
export function submitVerifierApplication(data: {
  userName: string;
  userEmail: string;
  reason: string;
  trustPledge: string;
}): VerifierApplication {
  const app: VerifierApplication = {
    id: `vapp-${Date.now()}`,
    userId: `user-${Date.now()}`,
    userName: data.userName,
    userEmail: data.userEmail,
    reason: data.reason,
    trustPledge: data.trustPledge,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      const apps: VerifierApplication[] = raw ? JSON.parse(raw) : [];
      apps.unshift(app);
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
    } catch {
      // Ignore
    }
  }
  return app;
}

/**
 * Get all verifier applications (for admin review)
 */
export function getVerifierApplications(): VerifierApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
