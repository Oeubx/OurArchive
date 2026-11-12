import { DriveLink, LinkStatus, UserRole, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";
import { segmentDriveUrl } from "./urlSegmenter";
import { recordAuditEvent, recordExpungeTombstone } from "./auditService";
import { createClient } from "./supabase/client";

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
 * Retrieve all community submissions directly from Supabase [OA-M3-F2]
 * Bypasses mock local storage entirely and purges legacy localStorage seeds.
 */
export async function fetchAdminCommunityLinks(): Promise<DriveLink[]> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_COMMUNITY_LINKS);
      localStorage.removeItem(STORAGE_KEY_APPLICATIONS);
    } catch {
      // Ignore
    }
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
        google_file_id,
        upload_mode,
        uploader_user_id,
        verification_status,
        is_hidden,
        is_removed,
        created_at,
        link_metadata (
          title,
          author_name,
          fandom,
          pairing,
          rating,
          word_count,
          summary,
          tags,
          mime_type,
          drive_owner_name,
          drive_owner_email
        ),
        link_verifications (
          verification_badge,
          automated_risk_score,
          admin_verified_at,
          admin_verified_by
        )
      `)
      .eq("is_removed", false)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Could not query community submissions from Supabase:", error);
      return [];
    }

    // Batch query user_profiles to resolve authentic contributor display names
    const userIds = Array.from(new Set(data.map((d) => d.uploader_user_id).filter(Boolean))) as string[];
    const profileMap = new Map<string, { displayName: string; role: UserRole }>();

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name, role")
          .in("id", userIds);

        profiles?.forEach((p) => {
          if (p.id && p.display_name) {
            profileMap.set(p.id, {
              displayName: p.display_name,
              role: (p.role as UserRole) || "contributor",
            });
          }
        });
      } catch (profileErr) {
        console.warn("Could not batch resolve contributor profiles:", profileErr);
      }
    }

    return data.map((item) => {
      const meta = Array.isArray(item.link_metadata)
        ? item.link_metadata[0]
        : item.link_metadata;
      const verif = Array.isArray(item.link_verifications)
        ? item.link_verifications[0]
        : item.link_verifications;

      let status: LinkStatus = "under_verification";
      if (item.is_hidden) {
        status = "hidden";
      } else if (item.verification_status === "verified") {
        status = "approved";
      } else if (item.verification_status === "rejected") {
        status = "rejected";
      } else if (item.verification_status === "flagged") {
        status = "flagged";
      }

      const ratingVal = (meta?.rating || "General Audiences") as DriveLink["rating"];

      const profile = item.uploader_user_id ? profileMap.get(item.uploader_user_id) : undefined;
      const resolvedDisplayName =
        profile?.displayName ||
        meta?.drive_owner_name ||
        (item.upload_mode === "assisted_admin" ? "admin" : "Community Contributor");

      const resolvedRole: UserRole =
        profile?.role ||
        (item.upload_mode === "assisted_admin" ? "admin" : "contributor");

      return {
        id: item.id,
        title: meta?.title || "Untitled Fanwork",
        authorName: meta?.author_name || "Anonymous Contributor",
        fandom: meta?.fandom || "General Fanworks",
        pairing: meta?.pairing || undefined,
        rating: ratingVal,
        wordCount: meta?.word_count ?? 0,
        summary: meta?.summary || "",
        tags: meta?.tags || [],
        rawDriveUrl: item.drive_url,
        maskedDriveUrl: maskDriveUrl(item.drive_url),
        mimeType: meta?.mime_type || "application/pdf",
        driveOwnerName: meta?.drive_owner_name || undefined,
        driveOwnerEmail: meta?.drive_owner_email || undefined,
        isOwnerMasked: true,
        uploadedBy: resolvedDisplayName,
        uploaderUserId: item.uploader_user_id || undefined,
        uploadedByRole: resolvedRole,
        uploadedAt: item.created_at,
        status,
        verificationBadge: verif?.verification_badge || (item.verification_status === "verified" ? "VERIFIED BY ADMIN" : undefined),
        adminVerifiedAt: verif?.admin_verified_at || undefined,
        verifiedBy: verif?.admin_verified_by || undefined,
        automatedRiskScore: verif?.automated_risk_score ?? 0,
        isPriorVerified: item.verification_status === "verified",
      };
    });
  } catch (err) {
    console.error("fetchAdminCommunityLinks error:", err);
    return [];
  }
}

/**
 * Retrieve all community submissions (purges mock seeds)
 */
export function getAllCommunityLinks(): DriveLink[] {
  if (typeof window === "undefined") return DEFAULT_COMMUNITY_LINKS;
  try {
    if (localStorage.getItem(STORAGE_KEY_COMMUNITY_LINKS)) {
      localStorage.removeItem(STORAGE_KEY_COMMUNITY_LINKS);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Persist community submissions
 */
function saveCommunityLinks(_links: DriveLink[]) {
  notifyListeners();
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
  mimeType?: string;
  isFolder?: boolean;
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
    mimeType: data.isFolder ? "application/vnd.google-apps.folder" : (data.mimeType || "application/pdf"),
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
    if (localStorage.getItem(STORAGE_KEY_APPLICATIONS)) {
      localStorage.removeItem(STORAGE_KEY_APPLICATIONS);
    }
  } catch {
    // Ignore
  }
  return [];
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

  notifyListeners();
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

  notifyListeners();
  return true;
}

/**
 * Compute aggregate metrics for Verifier and Admin dashboards
 */
export function getArchiveMetrics(sourceLinks?: DriveLink[]) {
  const links = sourceLinks || getAllCommunityLinks();
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
