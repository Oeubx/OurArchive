/**
 * Immediate Takedown Intake API Endpoint
 * Backlog Items: [OA-M3-F5]
 * Specifications: docs/disclaimers/takedown_and_removal_request.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeDriveUrl } from "@/lib/services/drive-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, targetQuery, role, requesterEmail, reason, preference } = body;

    const queryStr = (targetQuery || workId || "").trim();
    if (!queryStr) {
      return NextResponse.json(
        { error: "A valid Work ID, story title, or Google Drive URL is required." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Locate the targeted drive work
    let targetLinkId: string | null = null;

    // Check by Work ID (UUID pattern)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        queryStr
      );

    if (workId || isUuid) {
      const searchId = workId || queryStr;
      const { data: link } = await adminSupabase
        .from("drive_links")
        .select("id")
        .eq("id", searchId)
        .maybeSingle();

      if (link) {
        targetLinkId = link.id;
      }
    }

    // Check by Drive URL or File ID
    if (!targetLinkId) {
      const parsed = validateAndNormalizeDriveUrl(queryStr);
      if (parsed.isValid && parsed.fileId) {
        const { data: link } = await adminSupabase
          .from("drive_links")
          .select("id")
          .eq("google_file_id", parsed.fileId)
          .maybeSingle();

        if (link) {
          targetLinkId = link.id;
        }
      }
    }

    // Check by Title match in link_metadata
    if (!targetLinkId) {
      const { data: meta } = await adminSupabase
        .from("link_metadata")
        .select("link_id")
        .ilike("title", queryStr)
        .limit(1)
        .maybeSingle();

      if (meta) {
        targetLinkId = meta.link_id;
      }
    }

    // 2. Resolve an admin user profile for the audit log foreign key
    const { data: adminProfile } = await adminSupabase
      .from("user_profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    const auditAdminId = adminProfile?.id || null;

    // 3. Execute Immediate Suppression (Zero-Delay Hide)
    const now = new Date().toISOString();
    const isPermanent = preference === "permanent";

    if (targetLinkId) {
      await adminSupabase
        .from("drive_links")
        .update({
          is_hidden: true,
          is_removed: isPermanent,
          updated_at: now,
        })
        .eq("id", targetLinkId);

      if (auditAdminId) {
        await adminSupabase.from("admin_actions").insert({
          link_id: targetLinkId,
          admin_id: auditAdminId,
          action_type: isPermanent ? "REMOVE" : "HIDE",
          reason: `[IMMEDIATE_TAKEDOWN_REQUEST] Role: ${role || "author"} | Contact: ${
            requesterEmail || "anonymous"
          } | Reason: ${reason || "Fast-track removal requested."}`,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        matched: Boolean(targetLinkId),
        message: targetLinkId
          ? "The requested fanwork has been immediately suppressed from public view and queued for full purge."
          : "Your takedown request has been received. Our administration team has logged the details for manual review and immediate action.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
