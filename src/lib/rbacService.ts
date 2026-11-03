import { DriveLink, LinkStatus, UserRole, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";
import { getVerifierApplications } from "./contributorService";

const STORAGE_KEY_COMMUNITY_LINKS = "ourarchive_community_links";
const STORAGE_KEY_APPLICATIONS = "ourarchive_verifier_applications";
const STORAGE_KEY_ROLE = "ourarchive_dev_role";

// Initial seed data for community submissions in the triage and verifier queues
const DEFAULT_COMMUNITY_LINKS: DriveLink[] = [
  {
    id: "comm-001",
    title: "The Constellation Theory (Part 1)",
    authorName: "astral_wanderer",
    fandom: "Genshin Impact",
    pairing: "Zhongli/Tartaglia",
    rating: "Teen And Up Audiences",
    wordCount: 18500,
    summary: "When the ancient celestial charting instruments in Liyue harbor begin pointing towards Snezhnaya, an astronomer must decipher celestial anomalies before winter solstice.",
    tags: ["Action/Adventure", "Lore Exploration", "Slow Burn", "Astronomy AU"],
    rawDriveUrl: "https://drive.google.com/file/d/1CdeF0gH1IjK2LmN3OpQ4RsT5UvW6XyZ7/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1CdeF0gH1IjK2LmN3OpQ4RsT5UvW6XyZ7/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "astral_wanderer",
    driveOwnerEmail: "astral@example.com",
    isOwnerMasked: true,
    uploadedBy: "astral_scribe",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-02T15:20:00Z",
    status: "under_verification",
    automatedRiskScore: 0,
  },
  {
    id: "comm-002",
    title: "Before the Dawn Patrol",
    authorName: "wing_pilot",
    fandom: "Top Gun",
    pairing: "Pete 'Maverick' Mitchell/Tom 'Iceman' Kazansky",
    rating: "Teen And Up Audiences",
    wordCount: 12400,
    summary: "Early morning debriefs in Miramar during the heat of July. Ice discovers Maverick's notebook full of undocumented flight patterns.",
    tags: ["Military Fiction", "Pining", "Aviation Detail"],
    rawDriveUrl: "https://drive.google.com/file/d/1EhiJ5kL6MnO7PqR8StU9VwX0ZaB1CdE2/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1EhiJ5kL6MnO7PqR8StU9VwX0ZaB1CdE2/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "wing_pilot",
    driveOwnerEmail: "wingpilot@example.com",
    isOwnerMasked: true,
    uploadedBy: "flight_cadet",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-03T08:10:00Z",
    status: "under_verification",
    automatedRiskScore: 0,
  },
  {
    id: "comm-003",
    title: "Tea Leaves & Transfiguration",
    authorName: "marauder_fan",
    fandom: "Harry Potter",
    pairing: "Remus Lupin/Sirius Black",
    rating: "General Audiences",
    wordCount: 31000,
    summary: "Sixth year at Hogwarts. Remus attempts to tutor Sirius in Divination with catastrophic and delightfully chaotic results.",
    tags: ["Hogwarts Era", "Fluff", "Friendship to Romance"],
    rawDriveUrl: "https://drive.google.com/file/d/1FjkL7mN8OpQ9RsT0UvW1XyZ2AbC3DeF4/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1FjkL7mN8OpQ9RsT0UvW1XyZ2AbC3DeF4/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "marauder_fan",
    driveOwnerEmail: "marauder@example.com",
    isOwnerMasked: true,
    uploadedBy: "padfoot_devotee",
    uploadedByRole: "contributor",
    uploadedAt: "2026-10-31T20:45:00Z",
    status: "approved",
    verificationBadge: "VERIFIED BY ADMIN",
    adminVerifiedAt: "2026-11-01T09:00:00Z",
    verifiedBy: "biboy_admin",
    automatedRiskScore: 0,
    isPriorVerified: true,
  },
  {
    id: "comm-004",
    title: "To Build a Home (Chapters 1 - 5)",
    authorName: "starlight_scribe",
    fandom: "Heartstopper",
    pairing: "Nick Nelson/Charlie Spring",
    rating: "General Audiences",
    wordCount: 24180,
    summary: "A quiet seaside getaway during the late summer break. Nick learns how to navigate university applications while keeping Charlie grounded.",
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
    id: "comm-005",
    title: "Midnight Oil and Espresso Shots",
    authorName: "cyber_bard",
    fandom: "Arcane: League of Legends",
    pairing: "Caitlyn Kiramman/Vi",
    rating: "Teen And Up Audiences",
    wordCount: 15600,
    summary: "Piltover Enforcers graveyard shift investigation of chemtech shipments entering the Upper City docks.",
    tags: ["Detective Work", "Action", "Slow Burn"],
    rawDriveUrl: "https://drive.google.com/file/d/1GhiJ8kL9MnO0PqR1StU2VwX3ZaB4CdE5/view?usp=sharing",
    maskedDriveUrl: maskDriveUrl("https://drive.google.com/file/d/1GhiJ8kL9MnO0PqR1StU2VwX3ZaB4CdE5/view?usp=sharing"),
    mimeType: "application/pdf",
    driveOwnerName: "cyber_bard",
    driveOwnerEmail: "cyberbard@example.com",
    isOwnerMasked: true,
    uploadedBy: "enforcer_fan",
    uploadedByRole: "contributor",
    uploadedAt: "2026-11-03T11:00:00Z",
    status: "under_verification",
    automatedRiskScore: 0,
  },
];

// Initial seed applications for testing verifier review
const DEFAULT_VERIFIER_APPLICATIONS: VerifierApplication[] = [
  {
    id: "vapp-seed-001",
    userId: "user-charlie-01",
    userName: "Charlie (@reader_charlie)",
    userEmail: "reader_charlie@gmail.com",
    reason: "I read daily on AO3 and want to help fellow readers safely access Heartstopper and Arcane works during the server downtime.",
    trustPledge: "I have experience configuring view-only Google Drive permissions and know how to spot executable .exe files or macro-enabled documents.",
    status: "pending",
    submittedAt: "2026-11-03T10:15:00Z",
  },
  {
    id: "vapp-seed-002",
    userId: "user-elena-02",
    userName: "Elena M. (@archive_scribe)",
    userEmail: "elena.m@example.org",
    reason: "Longtime fanfiction reader and digital archivist. I want to assist in keeping fanworks accessible with accurate tagging.",
    trustPledge: "I pledge to inspect every link thoroughly for viewer-only safety before giving approval, and immediately flag suspicious downloads.",
    status: "pending",
    submittedAt: "2026-11-03T12:30:00Z",
  },
];

// In-memory event listeners for reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in rbac listener:", e);
    }
  });
}

export function subscribeToRbacUpdates(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get the currently active user role.
 * Resolves from localStorage (dev override) or falls back to 'contributor' for test users.
 */
export function getCurrentUserRole(): UserRole {
  if (typeof window === "undefined") return "contributor";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROLE);
    if (stored === "admin" || stored === "verifier" || stored === "contributor") {
      return stored;
    }
  } catch {
    // fallback
  }
  return "contributor";
}

/**
 * Set simulated active role for testing and preview
 */
export function setSimulatedRole(role: UserRole) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_ROLE, role);
      document.cookie = `ourarchive_dev_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      notifyListeners();
    } catch {
      // Ignore
    }
  }
}

/**
 * Retrieve all community submissions
 */
export function getAllCommunityLinks(): DriveLink[] {
  if (typeof window === "undefined") return DEFAULT_COMMUNITY_LINKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMMUNITY_LINKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_LINKS, JSON.stringify(DEFAULT_COMMUNITY_LINKS));
      return DEFAULT_COMMUNITY_LINKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COMMUNITY_LINKS;
  }
}

/**
 * Persist community submissions
 */
function saveCommunityLinks(links: DriveLink[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_LINKS, JSON.stringify(links));
      notifyListeners();
    } catch {
      // Ignore
    }
  }
}

/**
 * Verifier / Admin: Approve a submission
 */
export function approveLink(linkId: string, reviewerName: string = "verifier_team"): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "approved",
    verificationBadge: "VERIFIED BY ADMIN",
    adminVerifiedAt: new Date().toISOString(),
    verifiedBy: reviewerName,
  };

  saveCommunityLinks(links);
  return true;
}

/**
 * Verifier / Admin: Reject a submission
 */
export function rejectLink(linkId: string, reviewerName: string = "verifier_team"): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "rejected",
    verifiedBy: reviewerName,
  };

  saveCommunityLinks(links);
  return true;
}

/**
 * Verifier / Admin: Hide a submission
 */
export function hideLink(linkId: string): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "hidden",
  };

  saveCommunityLinks(links);
  return true;
}

/**
 * Verifier / Admin: Unhide / restore a submission
 */
export function unhideLink(linkId: string): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "approved",
  };

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Mark a submission as explicitly verified
 */
export function verifyLink(linkId: string, adminName: string = "biboy_admin"): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "approved",
    verificationBadge: "VERIFIED BY ADMIN",
    adminVerifiedAt: new Date().toISOString(),
    verifiedBy: adminName,
    isPriorVerified: true,
  };

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Permanently delete/remove a submission
 */
export function removeLink(linkId: string): boolean {
  const links = getAllCommunityLinks();
  const filtered = links.filter((l) => l.id !== linkId);
  if (filtered.length === links.length) return false;

  saveCommunityLinks(filtered);
  return true;
}

/**
 * Admin Direct Upload
 */
export function adminDirectUpload(data: {
  title: string;
  authorName: string;
  fandom: string;
  pairing?: string;
  rating: "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit" | "Not Rated";
  wordCount: number;
  summary: string;
  tags: string[];
  rawDriveUrl: string;
  driveOwnerEmail?: string;
  isPriorVerified: boolean;
}): DriveLink {
  const links = getAllCommunityLinks();
  const isApproved = data.isPriorVerified;

  const newLink: DriveLink = {
    id: `admin-upload-${Date.now()}`,
    title: data.title,
    authorName: data.authorName,
    fandom: data.fandom,
    pairing: data.pairing,
    rating: data.rating,
    wordCount: data.wordCount,
    summary: data.summary,
    tags: data.tags,
    rawDriveUrl: data.rawDriveUrl,
    maskedDriveUrl: maskDriveUrl(data.rawDriveUrl),
    mimeType: "application/pdf",
    driveOwnerEmail: data.driveOwnerEmail,
    isOwnerMasked: true,
    uploadedBy: "biboy_admin",
    uploadedByRole: "admin",
    uploadedAt: new Date().toISOString(),
    status: isApproved ? "approved" : "under_verification",
    verificationBadge: isApproved ? "VERIFIED BY ADMIN" : undefined,
    adminVerifiedAt: isApproved ? new Date().toISOString() : undefined,
    verifiedBy: isApproved ? "biboy_admin" : undefined,
    automatedRiskScore: 0,
    isPriorVerified: data.isPriorVerified,
  };

  saveCommunityLinks([newLink, ...links]);
  return newLink;
}

/**
 * Retrieve all verifier applications (including seeds and contributorService entries)
 */
export function getAllVerifierApplications(): VerifierApplication[] {
  if (typeof window === "undefined") return DEFAULT_VERIFIER_APPLICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(DEFAULT_VERIFIER_APPLICATIONS));
      return DEFAULT_VERIFIER_APPLICATIONS;
    }
    const apps: VerifierApplication[] = JSON.parse(raw);
    if (apps.length === 0) {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(DEFAULT_VERIFIER_APPLICATIONS));
      return DEFAULT_VERIFIER_APPLICATIONS;
    }
    return apps;
  } catch {
    return DEFAULT_VERIFIER_APPLICATIONS;
  }
}

/**
 * Retrieve pending verifier applications
 */
export function getPendingVerifierApplications(): VerifierApplication[] {
  return getAllVerifierApplications().filter((app) => app.status === "pending");
}

/**
 * Admin: Approve a verifier application
 */
export function approveVerifierApplication(applicationId: string, adminName: string = "biboy_admin"): boolean {
  const apps = getAllVerifierApplications();
  const index = apps.findIndex((a) => a.id === applicationId);
  if (index === -1) return false;

  apps[index] = {
    ...apps[index],
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
      notifyListeners();
    } catch {
      // Ignore
    }
  }
  return true;
}

/**
 * Admin: Decline a verifier application
 */
export function declineVerifierApplication(applicationId: string, adminName: string = "biboy_admin"): boolean {
  const apps = getAllVerifierApplications();
  const index = apps.findIndex((a) => a.id === applicationId);
  if (index === -1) return false;

  apps[index] = {
    ...apps[index],
    status: "declined",
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
      notifyListeners();
    } catch {
      // Ignore
    }
  }
  return true;
}

/**
 * Compute aggregate metrics for Verifier and Admin dashboards
 */
export function getArchiveMetrics() {
  const links = getAllCommunityLinks();
  const apps = getAllVerifierApplications();

  const approvedCount = links.filter((l) => l.status === "approved").length;
  const underVerificationCount = links.filter((l) => l.status === "under_verification").length;
  const hiddenCount = links.filter((l) => l.status === "hidden").length;
  const rejectedCount = links.filter((l) => l.status === "rejected").length;
  const pendingApplicationsCount = apps.filter((a) => a.status === "pending").length;

  return {
    approvedCount,
    underVerificationCount,
    hiddenCount,
    rejectedCount,
    pendingApplicationsCount,
    totalLinksCount: links.length,
  };
}
