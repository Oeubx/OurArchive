import { createClient } from "@/lib/supabase/server";
import type { UserProfileRecord } from "@/types/database";

/**
 * Server-Side: Fetches the authenticated user's profile inside Server Components / Route Handlers.
 */
export async function getServerProfile(): Promise<UserProfileRecord | null> {
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
    return null;
  }

  return data;
}
