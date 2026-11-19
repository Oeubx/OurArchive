/**
 * Admin User Role Management Endpoint
 * Backlog Items: [OA-M1-F2], [OA-M3-F3]
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/auth/rbac";

const ALLOWED_ROLES = ["contributor", "verifier", "admin"] as const;

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
    const { data: users, error } = await adminSupabase
      .from("user_profiles")
      .select("id, display_name, role, is_banned, submission_count, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Query active non-removed submissions from drive_links to compute dynamic, accurate submission counts
    const { data: activeLinks } = await adminSupabase
      .from("drive_links")
      .select("uploader_user_id")
      .eq("is_removed", false);

    const activeCountMap = new Map<string, number>();
    activeLinks?.forEach((link) => {
      if (link.uploader_user_id) {
        activeCountMap.set(link.uploader_user_id, (activeCountMap.get(link.uploader_user_id) || 0) + 1);
      }
    });

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      submission_count: activeCountMap.get(u.id) ?? 0,
    }));

    return NextResponse.json({ success: true, users: enrichedUsers });
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

    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, newRole, reason } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { error: "targetUserId is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Fetch existing user profile
    const { data: targetProfile, error: fetchError } = await adminSupabase
      .from("user_profiles")
      .select("id, display_name, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (fetchError || !targetProfile) {
      return NextResponse.json(
        { error: "Target user profile not found." },
        { status: 404 }
      );
    }

    const previousRole = targetProfile.role;
    const now = new Date().toISOString();

    // Update role
    const { error: updateError } = await adminSupabase
      .from("user_profiles")
      .update({ role: newRole, updated_at: now })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update user role: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Log immutable administrative audit trail
    await adminSupabase.from("admin_actions").insert({
      link_id: null,
      admin_id: user.id,
      action_type: "APPROVE",
      reason: `[USER_ROLE_CHANGE] Role updated from '${previousRole}' to '${newRole}'. Reason: ${
        reason || "Direct administrator role adjustment."
      }`,
      work_title_snapshot: `User: ${targetProfile.display_name}`,
      author_name_snapshot: targetProfile.display_name,
      fandom_snapshot: `Role: ${newRole}`,
      masked_url_snapshot: `/users/${targetUserId}`,
      is_tombstone: false,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully changed ${targetProfile.display_name}'s role from '${previousRole}' to '${newRole}'.`,
      targetUserId,
      newRole,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
