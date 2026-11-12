import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMaskedFeedbackFeed,
  MIN_FEEDBACK_PAGE_SIZE,
} from "@/lib/services/feedback-server";
import { FeedbackPageClient } from "@/components/feedback/FeedbackPageClient";
import type { FeedbackFeedResponse } from "@/types/feedback";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/?auth_error=feedback_login_required");
  }

  // Resolve display name from user_profiles first, then auth metadata
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ||
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Archivist";

  let initialFeed: FeedbackFeedResponse = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: MIN_FEEDBACK_PAGE_SIZE,
    totalPages: 1,
  };
  let initialLoadError: string | null = null;

  try {
    initialFeed = await fetchMaskedFeedbackFeed({
      page: 1,
      pageSize: MIN_FEEDBACK_PAGE_SIZE,
      rating: "all",
    });
  } catch (err: unknown) {
    initialLoadError =
      err instanceof Error ? err.message : "Unable to load submitted feedback.";
  }

  return (
    <FeedbackPageClient
      initialFeed={initialFeed}
      displayName={displayName}
      initialLoadError={initialLoadError}
    />
  );
}
