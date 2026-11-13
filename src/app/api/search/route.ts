/**
 * Weighted Full-Text & Multi-Tag Search Endpoint
 * Backlog Items: [OA-M2-F3], [OA-M2-F5]
 * Specifications: docs/database/indexes_and_performance.md
 *                 docs/database/search_and_display_projection.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicSearchFeedRecord } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const fandom = searchParams.get("fandom")?.trim() || "";
    const rating = searchParams.get("rating")?.trim() || "";
    const tag = searchParams.get("tag")?.trim() || "";
    const contentFilter = searchParams.get("contentFilter")?.trim().toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    let query = supabase
      .from("vw_public_search_feed")
      .select("*", { count: "exact" });

    // Fandom filter
    if (fandom && fandom.toLowerCase() !== "all") {
      query = query.ilike("fandom", `%${fandom}%`);
    }

    // Rating filter
    if (rating && rating.toLowerCase() !== "all") {
      query = query.eq("rating", rating);
    }

    // Tag filter
    if (tag) {
      query = query.contains("tags", [tag]);
    }

    // Content Classification (SFW / NSFW) filter
    if (contentFilter === "sfw") {
      query = query.or('rating.in.("General Audiences","Teen And Up Audiences"),tags.cs.{"sfw"}');
    } else if (contentFilter === "nsfw") {
      query = query.or('rating.in.("Mature","Explicit"),tags.cs.{"nsfw"}');
    }

    // Full-Text / Keyword Search across title, author, fandom, and summary
    if (q) {
      // Escape special PostgREST characters to prevent query syntax injection
      const sanitizedQ = q.replace(/[%_,()]/g, " ").trim();
      if (sanitizedQ) {
        query = query.or(
          `title.ilike.%${sanitizedQ}%,author_name.ilike.%${sanitizedQ}%,fandom.ilike.%${sanitizedQ}%,summary.ilike.%${sanitizedQ}%`
        );
      }
    }

    // Keyset / Offset Ordering
    query = query.order("uploaded_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Database search error: ${error.message}` },
        { status: 500 }
      );
    }

    const works: PublicSearchFeedRecord[] = data || [];

    return NextResponse.json({
      success: true,
      works,
      pagination: {
        total: count ?? works.length,
        page,
        limit,
        totalPages: Math.ceil((count ?? works.length) / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
