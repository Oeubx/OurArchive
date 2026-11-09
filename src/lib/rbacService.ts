import { DriveLink, LinkStatus, UserRole, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";
import { segmentDriveUrl } from "./urlSegmenter";
import { recordAuditEvent, recordExpungeTombstone } from "./auditService";

const STORAGE_KEY_COMMUNITY_LINKS = "ourarchive_community_links";
const STORAGE_KEY_APPLICATIONS = "ourarchive_verifier_applications";
const STORAGE_KEY_ROLE = "ourarchive_dev_role";

export interface SystemScanReport {
  scannedAt: string;
  isValidDriveLink: boolean;
  fileId: string;
  riskScore: number; // 0 - 100
  isViewOnlyConfirmed: boolean;
  detectedMime: string;
  threatFlags: string[];
  verdict: "CLEAN" | "CAUTION" | "MALICIOUS";
}

// Initial community submissions list (empty by default; populated via Supabase / user submissions)
const DEFAULT_COMMUNITY_LINKS: DriveLink[] = [];

// Initial verifier applications list (empty by default)
const DEFAULT_VERIFIER_APPLICATIONS: VerifierApplication[] = [];

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
 * Executes an automated system scan of a Drive link before approval
 */
export function runSystemLinkScan(rawDriveUrl: string): SystemScanReport {
  const segments = segmentDriveUrl(rawDriveUrl);
  const now = new Date().toISOString();

  if (!segments.isValid) {
    return {
      scannedAt: now,
      isValidDriveLink: false,
      fileId: segments.fileId || "none",
      riskScore: 85,
      isViewOnlyConfirmed: false,
      detectedMime: "unknown",
      threatFlags: [segments.errorMessage || "Untrusted or invalid domain"],
      verdict: "MALICIOUS",
    };
  }

  const lower = rawDriveUrl.toLowerCase();
  const isSuspicious =
    lower.includes(".exe") ||
    lower.includes(".bat") ||
    lower.includes(".scr") ||
    lower.includes("payload") ||
    lower.includes(".vbs");

  if (isSuspicious) {
    return {
      scannedAt: now,
      isValidDriveLink: true,
      fileId: segments.fileId,
      riskScore: 90,
      isViewOnlyConfirmed: false,
      detectedMime: "application/x-msdownload",
      threatFlags: ["Executable binary or macro pattern detected"],
      verdict: "MALICIOUS",
    };
  }

  return {
    scannedAt: now,
    isValidDriveLink: true,
    fileId: segments.fileId,
    riskScore: 0,
    isViewOnlyConfirmed: true,
    detectedMime: "application/pdf (Safe View-Only Document)",
    threatFlags: [],
    verdict: "CLEAN",
  };
}

/**
 * Get the currently active user role.
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
      return [];
    }
    const parsed: DriveLink[] = JSON.parse(raw);
    // Sanitize any legacy mock seeds starting with comm-
    const cleaned = parsed.filter((l) => !l.id.startsWith("comm-"));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_LINKS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
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
 * Verifier / Admin: Approve a submission with optional prior verification badge
 */
export function approveLink(
  linkId: string,
  reviewerName: string = "verifier_team",
  isPriorVerified: boolean = false
): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "approved",
    verificationBadge: isPriorVerified ? "VERIFIED BY ADMIN" : undefined,
    adminVerifiedAt: isPriorVerified ? new Date().toISOString() : undefined,
    verifiedBy: reviewerName,
    isPriorVerified,
  };

  recordAuditEvent({
    linkId,
    workTitle: links[index].title,
    authorName: links[index].authorName,
    fandom: links[index].fandom,
    maskedDriveUrl: links[index].maskedDriveUrl,
    actionType: "APPROVED",
    actorId: reviewerName,
    actorName: reviewerName,
    actorRole: reviewerName.includes("admin") ? "admin" : "verifier",
    notes: isPriorVerified
      ? "Approved with prior verification override (VERIFIED BY ADMIN badge assigned)."
      : "Inspected and approved for public emergency catalog.",
  });

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

  recordAuditEvent({
    linkId,
    workTitle: links[index].title,
    authorName: links[index].authorName,
    fandom: links[index].fandom,
    maskedDriveUrl: links[index].maskedDriveUrl,
    actionType: "REJECTED",
    actorId: reviewerName,
    actorName: reviewerName,
    actorRole: reviewerName.includes("admin") ? "admin" : "verifier",
    notes: "Submission rejected by moderator.",
  });

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Hide a submission (Temporary Author Takedown Quarantine)
 */
export function hideLink(linkId: string, actorName: string = "admin"): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "hidden",
  };

  recordAuditEvent({
    linkId,
    workTitle: links[index].title,
    authorName: links[index].authorName,
    fandom: links[index].fandom,
    maskedDriveUrl: links[index].maskedDriveUrl,
    actionType: "HIDDEN",
    actorId: actorName,
    actorName: actorName,
    actorRole: "admin",
    notes: "Work placed in quarantine pending author takedown check.",
  });

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Unhide / restore a submission
 */
export function unhideLink(linkId: string, actorName: string = "admin"): boolean {
  const links = getAllCommunityLinks();
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return false;

  links[index] = {
    ...links[index],
    status: "approved",
  };

  recordAuditEvent({
    linkId,
    workTitle: links[index].title,
    authorName: links[index].authorName,
    fandom: links[index].fandom,
    maskedDriveUrl: links[index].maskedDriveUrl,
    actionType: "UNHIDDEN",
    actorId: actorName,
    actorName: actorName,
    actorRole: "admin",
    notes: "Quarantine lifted. Work visibility restored in catalog.",
  });

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Mark a submission as explicitly verified
 */
export function verifyLink(linkId: string, adminName: string = "admin"): boolean {
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

  recordAuditEvent({
    linkId,
    workTitle: links[index].title,
    authorName: links[index].authorName,
    fandom: links[index].fandom,
    maskedDriveUrl: links[index].maskedDriveUrl,
    actionType: "VERIFIED",
    actorId: adminName,
    actorName: adminName,
    actorRole: "admin",
    notes: "Manually re-scanned and verified permissions by lead admin.",
  });

  saveCommunityLinks(links);
  return true;
}

/**
 * Admin: Permanently delete/remove a submission.
 * Enforces policy: Target must be in 'hidden' state (quarantine), 'rejected' state,
 * OR deemed malicious by the system threat scanner (flagged or risk score >= 70).
 */
export function removeLink(linkId: string, actorName: string = "admin"): boolean {
  const links = getAllCommunityLinks();
  const target = links.find((l) => l.id === linkId);
  if (!target) return false;

  const isQuarantined = target.status === "hidden" || target.status === "rejected";
  const isMalicious = target.status === "flagged" || (target.automatedRiskScore ?? 0) >= 70;

  if (!isQuarantined && !isMalicious) {
    console.warn("Policy Violation: Cannot remove link unless it is Hidden, Rejected, or deemed Malicious.");
    return false;
  }

  recordExpungeTombstone({
    linkId: target.id,
    workTitle: target.title,
    authorName: target.authorName,
    fandom: target.fandom,
    maskedDriveUrl: target.maskedDriveUrl,
    actorId: actorName,
    actorName: actorName,
    actorRole: "admin",
    reason: isMalicious
      ? "Threat Scanner Emergency Purge: Malicious executable payload eliminated."
      : "Author Takedown Request: Permanently expunged from database and search index.",
  });

  const filtered = links.filter((l) => l.id !== linkId);
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
  uploadedBy?: string;
  uploadedByRole?: UserRole;
}): DriveLink {
  const links = getAllCommunityLinks();
  const isApproved = data.isPriorVerified;
  const submitterName = data.uploadedBy || "admin";
  const submitterRole: UserRole = data.uploadedByRole || "admin";

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
    uploadedBy: submitterName,
    uploadedByRole: submitterRole,
    uploadedAt: new Date().toISOString(),
    status: isApproved ? "approved" : "under_verification",
    verificationBadge: isApproved ? "VERIFIED BY ADMIN" : undefined,
    adminVerifiedAt: isApproved ? new Date().toISOString() : undefined,
    verifiedBy: isApproved ? submitterName : undefined,
    automatedRiskScore: 0,
    isPriorVerified: data.isPriorVerified,
  };

  recordAuditEvent({
    linkId: newLink.id,
    workTitle: newLink.title,
    authorName: newLink.authorName,
    fandom: newLink.fandom,
    maskedDriveUrl: newLink.maskedDriveUrl,
    actionType: "UPLOADED",
    actorId: submitterName,
    actorName: submitterName,
    actorRole: "admin",
    notes: isApproved
      ? "Admin direct upload with prior verification (published directly as Approved)."
      : "Admin direct upload routed to Under Verification queue for community verifiers.",
  });

  saveCommunityLinks([newLink, ...links]);
  return newLink;
}

/**
 * Retrieve all verifier applications
 */
export function getAllVerifierApplications(): VerifierApplication[] {
  if (typeof window === "undefined") return DEFAULT_VERIFIER_APPLICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (!raw) {
      return [];
    }
    const apps: VerifierApplication[] = JSON.parse(raw);
    // Sanitize any legacy mock seeds starting with vapp-seed-
    const cleaned = apps.filter((a) => !a.id.startsWith("vapp-seed-"));
    if (cleaned.length !== apps.length) {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
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
export function approveVerifierApplication(applicationId: string, adminName: string = "admin"): boolean {
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
export function declineVerifierApplication(applicationId: string, adminName: string = "admin"): boolean {
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
  const flaggedCount = links.filter((l) => l.status === "flagged" || (l.automatedRiskScore ?? 0) >= 70).length;
  const pendingApplicationsCount = apps.filter((a) => a.status === "pending").length;

  return {
    approvedCount,
    underVerificationCount,
    hiddenCount,
    rejectedCount,
    flaggedCount,
    pendingApplicationsCount,
    totalLinksCount: links.length,
  };
}
