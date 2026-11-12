import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
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
  if (process.env.NODE_ENV === "development") {
    try {
      const cookieStore = cookies();
      const devRole = cookieStore.get("ourarchive_dev_role")?.value;
      if (devRole === "admin") {
        return {
          user: {
            id: "dev-admin-user",
            email: "admin@example.com",
            app_metadata: { role: "admin" },
            user_metadata: { full_name: "Lead System Administrator" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User,
        };
      }
    } catch {
      // ignore
    }
  }

  try {
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
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    redirect("/?auth_error=admin_login_required");
  }
}
