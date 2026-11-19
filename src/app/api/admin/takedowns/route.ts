/**
 * Admin Takedown Requests Queue Endpoint
 * Protected by administrator role check; exposes resolved Google Drive links,
 * ownership proof/credibility notes, and request status management.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/auth/rbac";
import type { TakedownStatus } from "@/types/database";

const VALID_STATUSES: TakedownStatus[] = [
  "pending",
  "quarantined",
  "purged",
  "dismissed",
];

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("takedown_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch takedown queue: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data || [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Request id is required." },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status as TakedownStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("takedown_requests")
      .update({
        status: status as TakedownStatus,
        resolved_by: user.id,
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update takedown request: ${error.message}` },
        { status: 500 }
      );
    }

    // If dismissing the takedown request within the 3-hour review window, clear the takedown timer
    if (status === "dismissed" && data?.link_id) {
      await adminSupabase
        .from("drive_links")
        .update({
          takedown_flagged_at: null,
          takedown_deadline: null,
          updated_at: now,
        })
        .eq("id", data.link_id);
    }

    return NextResponse.json({ request: data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
