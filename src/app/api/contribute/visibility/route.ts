/**
 * Contributor Personal Archive Visibility Management Endpoint
 * Backlog Items: [OA-M2-F6]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to update fanwork visibility." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { linkId, isHidden } = body;

    if (!linkId || typeof linkId !== "string") {
      return NextResponse.json(
        { error: "A valid linkId is required." },
        { status: 400 }
      );
    }

    if (typeof isHidden !== "boolean") {
      return NextResponse.json(
        { error: "isHidden boolean flag is required." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch link details to verify ownership and quarantine status
    const { data: link, error: fetchError } = await adminSupabase
      .from("drive_links")
      .select("id, drive_url, uploader_user_id, verification_status, is_hidden, is_removed")
      .eq("id", linkId)
      .maybeSingle();

    if (fetchError || !link) {
      return NextResponse.json(
        { error: "Fanwork link not found." },
        { status: 404 }
      );
    }

    // 2. Ownership & RBAC Verification
    const isOwner = link.uploader_user_id === user.id;
    const isUserAdmin = isAdminUser(user);

    if (!isOwner && !isUserAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this work's visibility." },
        { status: 403 }
      );
    }

    // 3. Safety Guardrail: Prevent unhiding works that are rejected or administratively removed
    if (!isHidden && (link.verification_status === "rejected" || link.is_removed)) {
      return NextResponse.json(
        {
          error:
            "This work has been rejected or administratively removed and cannot be made public without administrator review.",
        },
        { status: 400 }
      );
    }

    // 4. Update visibility on target link
    const nowIso = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from("drive_links")
      .update({
        is_hidden: isHidden,
        updated_at: nowIso,
      })
      .eq("id", linkId);

    if (updateError) {
      return NextResponse.json(
        { error: `Database error updating visibility: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 5. If this is a folder collection, synchronize child works matching canonical_source_url
    try {
      const { data: childLinks } = await adminSupabase
        .from("link_metadata")
        .select("link_id")
        .eq("canonical_source_url", link.drive_url);

      if (childLinks && childLinks.length > 0 && link.uploader_user_id) {
        const childIds = childLinks.map((c) => c.link_id);
        await adminSupabase
          .from("drive_links")
          .update({ is_hidden: isHidden, updated_at: nowIso })
          .in("id", childIds)
          .eq("uploader_user_id", link.uploader_user_id);
      }
    } catch {
      // Child sync is best-effort
    }

    return NextResponse.json({
      success: true,
      linkId,
      isHidden,
      message: isHidden
        ? "Work stored in your Personal Archive (private vault). Only you can read it."
        : "Work made Public. Discoverable by all readers once verified.",
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to update fanwork visibility.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
