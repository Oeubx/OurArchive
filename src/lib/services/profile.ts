import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
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
 * Server-Side: Fetches the authenticated user's profile inside Server Components / Route Handlers.
 */
export async function getServerProfile(): Promise<UserProfileRecord | null> {
  const supabase = createServerClient();
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
