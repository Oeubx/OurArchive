import { createAdminClient } from "@/lib/supabase/admin";
import type {
  FeedbackFeedResponse,
  FeedbackItemDto,
  FeedbackRatingFilter,
} from "@/types/feedback";

export const MIN_FEEDBACK_PAGE_SIZE = 5;
export const MAX_FEEDBACK_PAGE_SIZE = 20;

export function parseRatingFilter(raw: string | null | undefined): FeedbackRatingFilter {
  if (!raw || raw === "all") return "all";
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
    return parsed as 1 | 2 | 3 | 4 | 5;
  }
  return "all";
}

export function normalizePageSize(raw: number | string | null | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < MIN_FEEDBACK_PAGE_SIZE) {
    return MIN_FEEDBACK_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), MAX_FEEDBACK_PAGE_SIZE);
}

/**
 * Fetches paginated, rating-filtered feedback directly from Supabase (`public.feedback`)
 * ordered newest-first. Must ONLY be invoked after confirming an authenticated user session.
 *
 * Strips `user_id` from all returned objects and masks `authorName` as "Anonymous"
 * whenever `is_anonymous` is true.
 */
export async function fetchMaskedFeedbackFeed(options?: {
  page?: number;
  pageSize?: number;
  rating?: FeedbackRatingFilter;
}): Promise<FeedbackFeedResponse> {
  const requestedPage = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = normalizePageSize(options?.pageSize ?? MIN_FEEDBACK_PAGE_SIZE);
  const ratingFilter = options?.rating ?? "all";

  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from("feedback")
    .select("id, user_id, subject, description, rating, is_anonymous, created_at", {
      count: "exact",
    });

  if (ratingFilter !== "all") {
    query = query.eq("rating", ratingFilter);
  }

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch feedback from Supabase: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(requestedPage, totalPages);

  // If the requested page exceeded totalPages on non-empty data, re-fetch the final valid page
  let activeRows = rows ?? [];
  if (totalCount > 0 && requestedPage > totalPages) {
    const clampedFrom = (safePage - 1) * pageSize;
    const clampedTo = clampedFrom + pageSize - 1;
    let clampedQuery = adminSupabase
      .from("feedback")
      .select("id, user_id, subject, description, rating, is_anonymous, created_at");

    if (ratingFilter !== "all") {
      clampedQuery = clampedQuery.eq("rating", ratingFilter);
    }

    const { data: fallbackRows, error: fallbackError } = await clampedQuery
      .order("created_at", { ascending: false })
      .range(clampedFrom, clampedTo);

    if (fallbackError) {
      throw new Error(`Failed to fetch feedback page: ${fallbackError.message}`);
    }
    activeRows = fallbackRows ?? [];
  }

  // Only look up display names for non-anonymous feedback items
  const nonAnonymousUserIds = Array.from(
    new Set(
      activeRows
        .filter((row) => !row.is_anonymous)
        .map((row) => row.user_id)
    )
  );

  const displayNameByUserId = new Map<string, string>();
  if (nonAnonymousUserIds.length > 0) {
    const { data: profiles } = await adminSupabase
      .from("user_profiles")
      .select("id, display_name")
      .in("id", nonAnonymousUserIds);

    for (const profile of profiles ?? []) {
      if (profile.display_name) {
        displayNameByUserId.set(profile.id, profile.display_name);
      }
    }
  }

  const items: FeedbackItemDto[] = activeRows.map((row) => ({
    id: row.id,
    subject: row.subject,
    description: row.description,
    rating: row.rating,
    isAnonymous: row.is_anonymous,
    authorName: row.is_anonymous
      ? "Anonymous"
      : displayNameByUserId.get(row.user_id) || "Archivist",
    createdAt: row.created_at,
  }));

  return {
    items,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
  };
}
