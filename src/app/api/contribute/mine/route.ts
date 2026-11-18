/**
 * Contributor Personal Submissions API Endpoint
 * Backlog Items: [OA-M2-F2], [OA-M3-F3]
 * Allows authenticated contributors & verifiers to retrieve their own submissions,
 * including pending/under_verification works, bypassing client RLS limitations.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskDriveUrl } from "@/lib/utils";
import { DriveLink, LinkStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Sign-in required to access personal contributions." },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // Fetch user profile display name
    let contributorDisplayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Contributor";

    try {
      const { data: profile } = await adminSupabase
        .from("user_profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.display_name) {
        contributorDisplayName = profile.display_name;
      }
    } catch {
      // Fallback
    }

    // Query non-removed submissions belonging to this user
    const { data: records, error } = await adminSupabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
        upload_mode,
        uploader_user_id,
        verification_status,
        is_hidden,
        is_removed,
        created_at,
        link_metadata (
          title,
          author_name,
          fandom,
          pairing,
          rating,
          word_count,
          summary,
          tags,
          mime_type,
          file_name
        ),
        link_verifications (
          verification_badge,
          automated_risk_score,
          admin_verified_at,
          admin_verified_by
        )
      `)
      .eq("uploader_user_id", user.id)
      .eq("is_removed", false)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const links: DriveLink[] = (records || []).map((item) => {
      const meta = Array.isArray(item.link_metadata)
        ? item.link_metadata[0]
        : item.link_metadata;
      const verif = Array.isArray(item.link_verifications)
        ? item.link_verifications[0]
        : item.link_verifications;

      let status: LinkStatus = "under_verification";
      if (item.is_hidden) {
        status = "hidden";
      } else if (item.verification_status === "verified") {
        status = "approved";
      } else if (item.verification_status === "rejected") {
        status = "rejected";
      } else if (item.verification_status === "flagged") {
        status = "flagged";
      }

      const ratingVal = (meta?.rating || "Not Rated") as DriveLink["rating"];

      return {
        id: item.id,
        title: meta?.title || "Untitled Fanwork",
        authorName: meta?.author_name || "Anonymous Contributor",
        fandom: meta?.fandom || "General / Multi-Fandom",
        pairing: meta?.pairing || undefined,
        rating: ratingVal,
        wordCount: meta?.word_count ?? 0,
        summary: meta?.summary || "",
        tags: meta?.tags || [],
        rawDriveUrl: item.drive_url,
        maskedDriveUrl: maskDriveUrl(item.drive_url),
        mimeType: meta?.mime_type || "application/octet-stream",
        uploadedBy: contributorDisplayName,
        uploaderUserId: user.id,
        uploadedByRole: "contributor",
        uploadedAt: item.created_at,
        status,
        verificationBadge:
          verif?.verification_badge ||
          (item.verification_status === "verified" ? "VERIFIED BY ADMIN" : undefined),
        adminVerifiedAt: verif?.admin_verified_at || undefined,
        verifiedBy: verif?.admin_verified_by || undefined,
        automatedRiskScore: verif?.automated_risk_score ?? 0,
        isPriorVerified: item.verification_status === "verified",
        isOwnerMasked: true,
      };
    });

    return NextResponse.json({ success: true, links });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
