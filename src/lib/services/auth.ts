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
export async function signUpWithEmailPassword(email: string, password: string, redirectTo?: string) {
  const supabase = createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const targetUrl = redirectTo
    ? `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
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
