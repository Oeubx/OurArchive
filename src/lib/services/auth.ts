import { createClient } from "@/lib/supabase/client";

/**
 * Initiates frictionless OAuth sign-in with Discord.
 * Redirects user to Discord authorization prompt, then returns to /auth/callback.
 */
export async function signInWithDiscord(redirectTo?: string) {
  const supabase = createClient();
  const origin = window.location.origin;
  const targetUrl = redirectTo
    ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: targetUrl,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Initiates passwordless Email Magic Link sign-in.
 * Sends a single-use login link to the user's email address.
 */
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const supabase = createClient();
  const origin = window.location.origin;
  const targetUrl = redirectTo
    ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
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
