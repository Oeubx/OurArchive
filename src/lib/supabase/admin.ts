import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates an administrative Supabase client using the privileged service role key.
 * 
 * GUARD: This client bypasses Row-Level Security (RLS) and must NEVER be exposed
 * or imported into client components or transmitted to the browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: createAdminClient cannot be executed in a client/browser environment."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
