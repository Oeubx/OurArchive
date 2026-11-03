/**
 * Authenticated Contributor Link Submission Endpoint
 * Backlog Items: [OA-M2-F1], [OA-M2-F6], [OA-M3-F1], [OA-M3-F3]
 * Specifications: docs/architecture/drive_ingestion_and_search.md
 *                 docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *                 docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeDriveUrl } from "@/lib/services/drive-validator";
import { fetchDriveFileMetadata } from "@/lib/services/drive-api";
import { verifyTurnstileToken } from "@/lib/services/turnstile";
import { performFullThreatScan } from "@/lib/security/threat-scanner";
import { evaluateScanStateMachine } from "@/lib/security/state-machine";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to submit a work." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      driveUrl,
      title,
      authorName,
      fandom,
      pairing,
      rating,
      wordCount,
      summary,
      tags,
      canonicalAo3Url,
      isOwnerMasked,
      turnstileToken,
    } = body;

    // 1. Cloudflare Turnstile Bot Defense
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || "Turnstile bot verification failed." },
        { status: 400 }
      );
    }

    // 2. Validate Contributor Account Status & Velocity Limits
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("user_profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json(
        { error: "Your contributor account is suspended from submitting fanworks." },
        { status: 403 }
      );
    }

    // Velocity Limit: Max 5 submissions per hour per user account
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentSubmissionsCount } = await adminSupabase
      .from("drive_links")
      .select("*", { count: "exact", head: true })
      .eq("uploader_user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((recentSubmissionsCount || 0) >= 5) {
      return NextResponse.json(
        { error: "Upload velocity limit reached: maximum 5 submissions per hour." },
        { status: 429 }
      );
    }

    // 3. Validate Canonical Drive URL
    const urlValidation = validateAndNormalizeDriveUrl(driveUrl);
    if (!urlValidation.isValid || !urlValidation.fileId || !urlValidation.canonicalUrl) {
      return NextResponse.json(
        { error: urlValidation.error || "Invalid Google Drive link." },
        { status: 400 }
      );
    }

    // 4. Check Duplicate Active Submissions
    const { data: existingLink } = await adminSupabase
      .from("drive_links")
      .select("id")
      .eq("google_file_id", urlValidation.fileId)
      .eq("is_removed", false)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { error: "This Google Drive file has already been submitted to OurArchive." },
        { status: 409 }
      );
    }

    // 5. Inspect Google Drive API Metadata & Verify Read-Only
    const driveResult = await fetchDriveFileMetadata(urlValidation.fileId);
    if (!driveResult.success || !driveResult.metadata) {
      return NextResponse.json(
        { error: driveResult.error || "Failed to inspect Google Drive permissions." },
        { status: 400 }
      );
    }

    const { metadata } = driveResult;

    // 6. Automated Threat Scan & State Machine Evaluation [OA-M3-F1, OA-M3-F3]
    const scanResult = await performFullThreatScan(metadata, urlValidation.canonicalUrl);
    const evaluation = evaluateScanStateMachine(scanResult);

    // 7. Insert Drive Link Record
    const { data: newLink, error: linkError } = await adminSupabase
      .from("drive_links")
      .insert({
        drive_url: urlValidation.canonicalUrl,
        google_file_id: urlValidation.fileId,
        upload_mode: "authenticated",
        uploader_user_id: user.id,
        verification_status: evaluation.status,
        is_hidden: evaluation.isHidden,
        is_removed: false,
      })
      .select()
      .single();

    if (linkError || !newLink) {
      return NextResponse.json(
        { error: `Database error creating link: ${linkError?.message}` },
        { status: 500 }
      );
    }

    // 8. Insert Link Metadata Record
    const sanitizedTags = Array.isArray(tags)
      ? tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length > 0)
      : [];

    const { error: metadataError } = await adminSupabase.from("link_metadata").insert({
      link_id: newLink.id,
      title: (title || metadata.name).trim(),
      author_name: (authorName || "Unknown Author").trim(),
      fandom: (fandom || "General").trim(),
      pairing: pairing ? pairing.trim() : null,
      rating: rating ? rating.trim() : "Not Rated",
      word_count: typeof wordCount === "number" && wordCount >= 0 ? wordCount : 0,
      summary: summary ? summary.trim() : null,
      tags: sanitizedTags,
      canonical_ao3_url: canonicalAo3Url ? canonicalAo3Url.trim() : null,

      file_name: metadata.name,
      mime_type: metadata.mimeType,
      file_size_bytes: metadata.sizeBytes,
      drive_owner_name: metadata.ownerName,
      drive_owner_email: metadata.ownerEmail,
      is_owner_masked: isOwnerMasked !== false,
    });

    if (metadataError) {
      // Rollback link insertion on metadata failure
      await adminSupabase.from("drive_links").delete().eq("id", newLink.id);
      return NextResponse.json(
        { error: `Database error storing metadata: ${metadataError.message}` },
        { status: 500 }
      );
    }

    // 9. Record Link Verification and Risk Evaluation Metrics [OA-M3-F1, OA-M3-F3]
    await adminSupabase.from("link_verifications").insert({
      link_id: newLink.id,
      automated_risk_score: scanResult.riskScore,
      automated_flags: scanResult.flags,
      scanner_passed: evaluation.scannerPassed,
      admin_verified_by: null,
      admin_verified_at: null,
      admin_notes: evaluation.quarantineReason || null,
      verification_badge: evaluation.badge,
    });

    // 10. Increment Contributor Submission Count
    const { data: currentProfile } = await adminSupabase
      .from("user_profiles")
      .select("submission_count")
      .eq("id", user.id)
      .single();

    if (currentProfile) {
      await adminSupabase
        .from("user_profiles")
        .update({ submission_count: (currentProfile.submission_count || 0) + 1 })
        .eq("id", user.id);
    }

    const message =
      evaluation.status === "flagged"
        ? "Work submitted and quarantined due to safety flags. An administrator will review it before release."
        : "Fanwork submitted successfully. In queue for automated verification.";

    return NextResponse.json(
      {
        success: true,
        workId: newLink.id,
        verificationStatus: evaluation.status,
        verificationBadge: evaluation.badge,
        riskScore: scanResult.riskScore,
        message,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
