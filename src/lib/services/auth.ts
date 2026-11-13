import { createClient } from "@/lib/supabase/client";

/**
 * Signs in a user using Email and Password.
 */
export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Registers a new user with Email and Password.
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string,
  redirectTo?: string,
  displayName?: string,
  isAdult?: boolean
) {
  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const targetUrl = redirectTo
    ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/callback`;

  const trimmedName = displayName?.trim();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: targetUrl,
      data: {
        ...(trimmedName
          ? {
              display_name: trimmedName,
              full_name: trimmedName,
              name: trimmedName,
              user_name: trimmedName,
            }
          : {}),
        is_adult: Boolean(isAdult),
      },
    },
  });

  if (error) {
    throw error;
  }

  // If user was created immediately, ensure user_profiles display_name is updated
  if (data?.user?.id && trimmedName) {
    try {
      await supabase
        .from("user_profiles")
        .update({ display_name: trimmedName })
        .eq("id", data.user.id);
    } catch {
      // Non-blocking fallback if RLS or trigger already handled it
    }
  }

  return data;
}

/**
 * Resends signup confirmation email.
 */
export async function resendConfirmationEmail(email: string, redirectTo?: string) {
  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const targetUrl = redirectTo
    ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: targetUrl,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs the user out of all sessions and purges auth cookies.
 */
export async function signOutUser() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
