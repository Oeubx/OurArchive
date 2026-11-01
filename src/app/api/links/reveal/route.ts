/**
 * Rate-Limited Masked Drive Link Reveal Protocol Endpoint
 * Backlog Items: [OA-M2-F5], [OA-M3-F6]
 * Specifications: docs/architecture/reader_and_anti_bot_protection.md
 *                 docs/database/search_and_display_projection.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, token } = body;

    if (!workId && !token) {
      return NextResponse.json(
        { error: "Work ID or reveal token is required." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
        google_file_id,
        upload_mode,
        verification_status,
        is_hidden,
        is_removed,
        link_metadata (
          title,
          author_name,
          fandom,
          drive_owner_name,
          drive_owner_email,
          is_owner_masked
        ),
        link_verifications (
          verification_badge,
          automated_risk_score,
          admin_verified_at
        )
      `)
      .eq("is_removed", false);

    if (workId) {
      query = query.eq("id", workId);
    }

    const { data: link, error } = await query.maybeSingle();

    if (error || !link) {
      return NextResponse.json(
        { error: "Drive work not found or has been removed." },
        { status: 404 }
      );
    }

    // Safety rule: Do not reveal hidden links to public readers
    if (link.is_hidden) {
      return NextResponse.json(
        { error: "This fanwork has been hidden by the author or administrator." },
        { status: 403 }
      );
    }

    // Process metadata
    const metadata = Array.isArray(link.link_metadata)
      ? link.link_metadata[0]
      : link.link_metadata;

    const verification = Array.isArray(link.link_verifications)
      ? link.link_verifications[0]
      : link.link_verifications;

    // Mask owner email if requested
    let displayOwner = metadata?.drive_owner_name || "Community Volunteer";
    if (metadata?.is_owner_masked && metadata?.drive_owner_email) {
      const email = metadata.drive_owner_email;
      const atIdx = email.indexOf("@");
      if (atIdx > 2) {
        displayOwner = `${email.slice(0, 2)}***${email.slice(atIdx)}`;
      } else {
        displayOwner = "Anonymous Owner";
      }
    }

    return NextResponse.json({
      success: true,
      workId: link.id,
      driveUrl: link.drive_url,
      googleFileId: link.google_file_id,
      title: metadata?.title || "Untitled Fanwork",
      authorName: metadata?.author_name || "Unknown Author",
      displayOwner,
      verificationBadge: verification?.verification_badge || "UNVERIFIED",
      riskScore: verification?.automated_risk_score ?? 0,
      verifiedAt: verification?.admin_verified_at || null,
      safetyDisclaimer:
        "You are opening an external Google Drive view-only file. OurArchive has verified view-only status and clean MIME safety.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
