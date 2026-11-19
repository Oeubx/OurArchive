import { createClient } from "@/lib/supabase/client";
import type { UserProfileRecord } from "@/types/database";

/**
 * Client-Side: Fetches the authenticated user's profile record from public.user_profiles.
 */
export async function getCurrentProfile(): Promise<UserProfileRecord | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Updates the user's public display name.
 */
export async function updateDisplayName(
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const trimmed = displayName.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return {
      success: false,
      error: "Display name must be between 2 and 50 characters.",
    };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      display_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Verifies whether the contributor is permitted to upload new works.
 * Enforces ban checks and role eligibility.
 */
export async function checkContributorEligibility(): Promise<{
  eligible: boolean;
  reason?: string;
  profile?: UserProfileRecord;
}> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { eligible: false, reason: "You must be signed in to contribute." };
  }

  if (profile.is_banned) {
    return {
      eligible: false,
      reason: "This account has been flagged or banned by an administrator.",
      profile,
    };
  }

  return { eligible: true, profile };
}

export interface SubmissionMetrics {
  totalSubmissions: number;
  totalWorks: number;
}

/**
 * Client-Side: Fetches authentic live submission metrics from public.drive_links.
 * Distinguishes between top-level folder/standalone submissions and total unpacked works.
 */
export async function getLiveSubmissionMetrics(
  userId: string
): Promise<SubmissionMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drive_links")
    .select("id, drive_url, link_metadata(mime_type, tags, summary)")
    .eq("uploader_user_id", userId)
    .eq("is_removed", false);

  if (error || !data) {
    return { totalSubmissions: 0, totalWorks: 0 };
  }

  let folderCount = 0;
  let childWorksCount = 0;
  let standaloneCount = 0;

  for (const item of data) {
    const meta = (
      Array.isArray(item.link_metadata) ? item.link_metadata[0] : item.link_metadata
    ) as { mime_type?: string; tags?: string[]; summary?: string } | null;

    const isFolder =
      meta?.mime_type === "application/vnd.google-apps.folder" ||
      item.drive_url.includes("/folders/");
    const isChild =
      (meta?.tags && Array.isArray(meta.tags) && meta.tags.some((t: string) => t.startsWith("collection:"))) ||
      Boolean(meta?.summary && meta.summary.includes("Part of collection:"));

    if (isFolder) {
      folderCount += 1;
    } else if (isChild) {
      childWorksCount += 1;
    } else {
      standaloneCount += 1;
    }
  }

  const totalSubmissions = folderCount + standaloneCount;
  const totalWorks = childWorksCount + standaloneCount;

  return {
    totalSubmissions: Math.max(totalSubmissions, totalWorks > 0 ? 1 : 0),
    totalWorks,
  };
}
