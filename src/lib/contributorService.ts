import { DriveLink, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";

const STORAGE_KEY_CONTRIBUTIONS = "ourarchive_my_contributions";
const STORAGE_KEY_APPLICATIONS = "ourarchive_verifier_applications";

// Default initial contributions for testing the contributor table
const DEFAULT_MY_CONTRIBUTIONS: DriveLink[] = [
  {
    id: "my-contrib-001",
    title: "To Build a Home (Chapters 1 - 5)",
    authorName: "starlight_scribe",
    fandom: "Heartstopper",
    pairing: "Nick Nelson/Charlie Spring",
    rating: "General Audiences",
    wordCount: 24180,
    summary: "A quiet seaside getaway during the late summer break. Nick learns how to navigate university applications.",
    tags: ["Fluff", "Mutual Pining", "Beach Days"],
    rawDriveUrl: "https://drive.google.com/file/d/1BxyZ9qK8LmN0OpQrStUvWxYz12345678/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1BxyZ9qK8LmN0OpQrStUvWxYz12345678/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "archive_volunteer",
    driveOwnerEmail: "volunteer@example.com",
    isOwnerMasked: true,
    uploadedBy: "current_contributor",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-01T13:45:00Z",
    status: "approved",
    verificationBadge: "VERIFIED BY ADMIN",
    adminVerifiedAt: "2026-11-01T14:10:00Z",
    verifiedBy: "biboy_admin",
    automatedRiskScore: 0,
    isPriorVerified: true,
  },
  {
    id: "my-contrib-002",
    title: "The Constellation Theory (Part 1)",
    authorName: "astral_wanderer",
    fandom: "Genshin Impact",
    pairing: "Zhongli/Tartaglia",
    rating: "Teen And Up Audiences",
    wordCount: 18500,
    summary: "When the ancient celestial charting instruments in Liyue harbor begin pointing towards Snezhnaya.",
    tags: ["Action/Adventure", "Lore Exploration", "Slow Burn"],
    rawDriveUrl: "https://drive.google.com/file/d/1CdeF0gH1IjK2LmN3OpQ4RsT5UvW6XyZ7/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1CdeF0gH1IjK2LmN3OpQ4RsT5UvW6XyZ7/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "astral_wanderer",
    driveOwnerEmail: "astral@example.com",
    isOwnerMasked: true,
    uploadedBy: "current_contributor",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-02T15:20:00Z",
    status: "under_verification",
    automatedRiskScore: 0,
  },
  {
    id: "my-contrib-003",
    title: "Unpublished Chapter Drafts (Archival Backup)",
    authorName: "paper_cranes_fly",
    fandom: "Good Omens",
    rating: "General Audiences",
    wordCount: 8200,
    summary: "Temporary private mirror backup created prior to scheduled server maintenance.",
    tags: ["Alternate Universe", "Work in Progress"],
    rawDriveUrl: "https://drive.google.com/file/d/1DfgH3iJ4KlM5NoP6QrS7TuV8WxY9ZaB0/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1DfgH3iJ4KlM5NoP6QrS7TuV8WxY9ZaB0/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "paper_cranes_fly",
    driveOwnerEmail: "papercranes@example.com",
    isOwnerMasked: true,
    uploadedBy: "current_contributor",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-03T09:15:00Z",
    status: "hidden",
    automatedRiskScore: 0,
  },
];

/**
 * Get all contributions submitted by the current user
 */
export function getMyContributions(): DriveLink[] {
  if (typeof window === "undefined") return DEFAULT_MY_CONTRIBUTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTRIBUTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONTRIBUTIONS, JSON.stringify(DEFAULT_MY_CONTRIBUTIONS));
      return DEFAULT_MY_CONTRIBUTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MY_CONTRIBUTIONS;
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
