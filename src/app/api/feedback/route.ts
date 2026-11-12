import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMaskedFeedbackFeed,
  normalizePageSize,
  parseRatingFilter,
} from "@/lib/services/feedback-server";
import type { FeedbackItemDto } from "@/types/feedback";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to view feedback." },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const rawPage = Number(searchParams.get("page") ?? "1");
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const pageSize = normalizePageSize(searchParams.get("limit"));
    const rating = parseRatingFilter(searchParams.get("rating"));

    const feed = await fetchMaskedFeedbackFeed({
      page,
      pageSize,
      rating,
    });

    return NextResponse.json(feed, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch feedback.";
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
        { error: "Authentication required. Please sign in to submit feedback." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const rating = Number(body.rating);
    const isAnonymous = Boolean(body.isAnonymous);

    if (subject.length < 3 || subject.length > 150) {
      return NextResponse.json(
        { error: "Subject must be between 3 and 150 characters." },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { error: "Description must be between 10 and 2000 characters." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        subject,
        description,
        rating,
        is_anonymous: isAnonymous,
      })
      .select("id, subject, description, rating, is_anonymous, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to save feedback to Supabase." },
        { status: 500 }
      );
    }

    let resolvedAuthorName = "Anonymous";
    if (!data.is_anonymous) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      resolvedAuthorName =
        profile?.display_name ||
        (user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Archivist";
    }

    const feedbackItem: FeedbackItemDto = {
      id: data.id,
      subject: data.subject,
      description: data.description,
      rating: data.rating,
      isAnonymous: data.is_anonymous,
      authorName: resolvedAuthorName,
      createdAt: data.created_at,
    };

    return NextResponse.json({ feedback: feedbackItem }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
