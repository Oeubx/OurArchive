/**
 * Admin & Verifier Community Triage Links API Endpoint
 * Backlog Items: [OA-M3-F2], [OA-M3-F3]
 * Grants verifiers and administrators secure server-side access to all active community submissions.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVerifierOrAdminUser } from "@/lib/auth/rbac";
import { maskDriveUrl } from "@/lib/utils";
import { DriveLink, LinkStatus, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isVerifierOrAdminUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Verifier or Administrator privileges required." },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
        google_file_id,
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
          drive_owner_name,
          drive_owner_email
        ),
        link_verifications (
          verification_badge,
          automated_risk_score,
          admin_verified_at,
          admin_verified_by
        )
      `)
      .eq("is_removed", false)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to fetch links" }, { status: 500 });
    }

    // Batch query user_profiles to resolve authentic contributor display names
    const userIds = Array.from(
      new Set(data.map((d) => d.uploader_user_id).filter(Boolean))
    ) as string[];
    const profileMap = new Map<string, { displayName: string; role: UserRole }>();

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await adminSupabase
          .from("user_profiles")
          .select("id, display_name, role")
          .in("id", userIds);

        profiles?.forEach((p) => {
          if (p.id && p.display_name) {
            profileMap.set(p.id, {
              displayName: p.display_name,
              role: (p.role as UserRole) || "contributor",
            });
          }
        });
      } catch (profileErr) {
        console.warn("Could not batch resolve contributor profiles:", profileErr);
      }
    }

    const links: DriveLink[] = data.map((item) => {
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

      const ratingVal = (meta?.rating || "General Audiences") as DriveLink["rating"];

      const profile = item.uploader_user_id ? profileMap.get(item.uploader_user_id) : undefined;
      const resolvedDisplayName =
        profile?.displayName ||
        meta?.drive_owner_name ||
        (item.upload_mode === "assisted_admin" ? "admin" : "Community Contributor");

      const resolvedRole: UserRole =
        profile?.role ||
        (item.upload_mode === "assisted_admin" ? "admin" : "contributor");

      return {
        id: item.id,
        title: meta?.title || "Untitled Fanwork",
        authorName: meta?.author_name || "Anonymous Contributor",
        fandom: meta?.fandom || "General Fanworks",
        pairing: meta?.pairing || undefined,
        rating: ratingVal,
        wordCount: meta?.word_count ?? 0,
        summary: meta?.summary || "",
        tags: meta?.tags || [],
        rawDriveUrl: item.drive_url,
        maskedDriveUrl: maskDriveUrl(item.drive_url),
        mimeType: meta?.mime_type || "application/pdf",
        driveOwnerName: meta?.drive_owner_name || undefined,
        driveOwnerEmail: meta?.drive_owner_email || undefined,
        isOwnerMasked: true,
        uploadedBy: resolvedDisplayName,
        uploaderUserId: item.uploader_user_id || undefined,
        uploadedByRole: resolvedRole,
        uploadedAt: item.created_at,
        status,
        verificationBadge:
          verif?.verification_badge ||
          (item.verification_status === "verified" ? "VERIFIED BY ADMIN" : undefined),
        adminVerifiedAt: verif?.admin_verified_at || undefined,
        verifiedBy: verif?.admin_verified_by || undefined,
        automatedRiskScore: verif?.automated_risk_score ?? 0,
        isPriorVerified: item.verification_status === "verified",
      };
    });

    return NextResponse.json({ success: true, links });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
