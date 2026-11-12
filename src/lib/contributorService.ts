import { DriveLink, LinkStatus, VerifierApplication } from "./types";
import { maskDriveUrl } from "./utils";
import { createClient } from "./supabase/client";

const STORAGE_KEY_CONTRIBUTIONS = "ourarchive_my_contributions";
const STORAGE_KEY_APPLICATIONS = "ourarchive_verifier_applications";

// Default initial contributions (empty by default; populated via Supabase / user submissions)
const DEFAULT_MY_CONTRIBUTIONS: DriveLink[] = [];

/**
 * Fetch authentic contributions submitted by the authenticated user directly from Supabase.
 */
export async function fetchUserContributions(userId: string): Promise<DriveLink[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
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
          file_name
        )
      `)
      .eq("uploader_user_id", userId)
      .eq("is_removed", false)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Could not query user contributions from Supabase:", error);
      return [];
    }

    // Resolve contributor display name from user profile
    let contributorDisplayName = "Contributor";
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.display_name) {
        contributorDisplayName = profile.display_name;
      }
    } catch {
      // Fallback
    }

    return data.map((item) => {
      const meta = Array.isArray(item.link_metadata) ? item.link_metadata[0] : item.link_metadata;
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

      const ratingVal = (meta?.rating || "Not Rated") as DriveLink["rating"];

      return {
        id: item.id,
        title: meta?.title || "Untitled Fanwork",
        authorName: meta?.author_name || "Anonymous Contributor",
        fandom: meta?.fandom || "General / Multi-Fandom",
        pairing: meta?.pairing || undefined,
        rating: ratingVal,
        wordCount: meta?.word_count ?? 0,
        summary: meta?.summary || "",
        tags: meta?.tags || [],
        rawDriveUrl: item.drive_url,
        maskedDriveUrl: maskDriveUrl(item.drive_url),
        mimeType: meta?.mime_type || "application/octet-stream",
        uploadedBy: contributorDisplayName,
        uploaderUserId: userId,
        uploadedByRole: "contributor",
        uploadedAt: item.created_at,
        status,
        automatedRiskScore: 0,
        isOwnerMasked: true,
      };
    });
  } catch (err) {
    console.error("fetchUserContributions error:", err);
    return [];
  }
}

/**
 * Get all contributions submitted by the current user (purges legacy localized caches)
 */
export function getMyContributions(): DriveLink[] {
  if (typeof window === "undefined") return DEFAULT_MY_CONTRIBUTIONS;
  try {
    // Purge legacy localized contributions cache to prevent stale duplicate items
    if (localStorage.getItem(STORAGE_KEY_CONTRIBUTIONS)) {
      localStorage.removeItem(STORAGE_KEY_CONTRIBUTIONS);
    }
    return [];
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

  return app;
}

/**
 * Get all verifier applications (for admin review)
 */
export function getVerifierApplications(): VerifierApplication[] {
  if (typeof window === "undefined") return [];
  try {
    if (localStorage.getItem(STORAGE_KEY_APPLICATIONS)) {
      localStorage.removeItem(STORAGE_KEY_APPLICATIONS);
    }
  } catch {
    // Ignore
  }
  return [];
}
