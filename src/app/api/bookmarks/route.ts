/**
 * Authenticated User Bookmarks API
 * Persists reading progress & collection checkpoints in Supabase `public.user_bookmarks`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { maskWorkId, unmaskWorkId } from "@/lib/utils/idMasker";
import type { UserBookmarkRecord } from "@/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapRowToBookmark(row: UserBookmarkRecord) {
  return {
    workId: maskWorkId(row.link_id),
    title: row.work_title,
    authorName: row.author_name,
    fandom: row.fandom || "General",
    scrollPercent: Number(row.scroll_percent) || 0,
    lastPage: Number(row.last_page) || 1,
    updatedAt: row.updated_at,
    isPdf: Boolean(row.is_pdf),
    childId: row.child_id || undefined,
    childTitle: row.child_title || undefined,
    childMimeType: row.child_mime_type || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawWorkId = searchParams.get("workId")?.trim();

    if (rawWorkId) {
      const linkId = unmaskWorkId(rawWorkId);
      if (!UUID_REGEX.test(linkId)) {
        return NextResponse.json({ bookmark: null }, { status: 200 });
      }

      const { data, error } = await supabase
        .from("user_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .eq("link_id", linkId)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: `Failed to load bookmark: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { bookmark: data ? mapRowToBookmark(data as UserBookmarkRecord) : null },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("user_bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch bookmarks: ${error.message}` },
        { status: 500 }
      );
    }

    const bookmarks = ((data || []) as UserBookmarkRecord[]).map(mapRowToBookmark);
    return NextResponse.json({ bookmarks }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      workId,
      title,
      authorName,
      fandom,
      scrollPercent,
      lastPage,
      isPdf,
      childId,
      childTitle,
      childMimeType,
    } = body;

    if (!workId || typeof workId !== "string") {
      return NextResponse.json({ error: "workId is required." }, { status: 400 });
    }

    const linkId = unmaskWorkId(workId.trim());
    if (!UUID_REGEX.test(linkId)) {
      return NextResponse.json({ error: "Invalid workId." }, { status: 400 });
    }

    const clampedPercent = Math.min(
      100,
      Math.max(0, Number(scrollPercent) || 0)
    );
    const clampedPage = Math.max(1, Math.floor(Number(lastPage) || 1));

    const payload = {
      user_id: user.id,
      link_id: linkId,
      work_title: (typeof title === "string" && title.trim()) || "Untitled Work",
      author_name:
        (typeof authorName === "string" && authorName.trim()) || "Anonymous",
      fandom: typeof fandom === "string" && fandom.trim() ? fandom.trim() : null,
      scroll_percent: clampedPercent,
      last_page: clampedPage,
      is_pdf: Boolean(isPdf),
      child_id: typeof childId === "string" && childId.trim() ? childId.trim() : null,
      child_title:
        typeof childTitle === "string" && childTitle.trim()
          ? childTitle.trim()
          : null,
      child_mime_type:
        typeof childMimeType === "string" && childMimeType.trim()
          ? childMimeType.trim()
          : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_bookmarks")
      .upsert(payload, { onConflict: "user_id,link_id" })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Failed to save bookmark: ${error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { bookmark: mapRowToBookmark(data as UserBookmarkRecord) },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawWorkId = searchParams.get("workId")?.trim();

    if (!rawWorkId) {
      return NextResponse.json(
        { error: "workId query parameter is required." },
        { status: 400 }
      );
    }

    const linkId = unmaskWorkId(rawWorkId);
    if (!UUID_REGEX.test(linkId)) {
      return NextResponse.json({ error: "Invalid workId." }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("link_id", linkId);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete bookmark: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
