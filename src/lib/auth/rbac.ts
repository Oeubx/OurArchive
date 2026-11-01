import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

/**
 * Checks if a user possesses the admin role in their JWT app_metadata.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "admin";
}

/**
 * Server-Side Guard: Ensures the current request belongs to an authenticated admin.
 * If unauthenticated or unauthorized, redirects immediately.
 */
export async function requireAdmin(): Promise<{ user: User }> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/?auth_error=admin_login_required");
  }

  if (!isAdminUser(user)) {
    redirect("/admin/unauthorized");
  }

  return { user };
}
