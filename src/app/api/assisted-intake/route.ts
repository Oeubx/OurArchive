/**
 * Public Assisted Admin Intake Endpoint (Unauthenticated Pathway)
 * Backlog Items: [OA-M2-F6], [OA-M2-F1], [OA-M3-F1], [OA-M3-F3]
 * Specifications: docs/architecture/drive_ingestion_and_search.md
 *                 docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
    const body = await request.json();
    const {
      driveUrl,
      title,
      authorName,
      fandom,
      pairing,
      rating,
      summary,
      tags,
      canonicalSourceUrl,
      notes,
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

    // 2. Validate Canonical Drive URL
    const urlValidation = validateAndNormalizeDriveUrl(driveUrl);
    if (!urlValidation.isValid || !urlValidation.fileId || !urlValidation.canonicalUrl) {
      return NextResponse.json(
        { error: urlValidation.error || "Invalid Google Drive link format." },
        { status: 400 }
      );
    }

    // 3. Prevent Duplicate Submissions
    const adminSupabase = createAdminClient();
    const { data: existingLink } = await adminSupabase
      .from("drive_links")
      .select("id")
      .eq("google_file_id", urlValidation.fileId)
      .eq("is_removed", false)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { error: "This Google Drive file is already registered in OurArchive." },
        { status: 409 }
      );
    }

    // 4. Fetch Google Drive Metadata
    const driveResult = await fetchDriveFileMetadata(urlValidation.fileId);
    if (!driveResult.success || !driveResult.metadata) {
      return NextResponse.json(
        { error: driveResult.error || "Failed to inspect Google Drive permissions." },
        { status: 400 }
      );
    }

    const { metadata } = driveResult;

    // 5. Automated Threat Scan & State Machine Evaluation [OA-M3-F1, OA-M3-F3]
    const scanResult = await performFullThreatScan(metadata, urlValidation.canonicalUrl);
    const evaluation = evaluateScanStateMachine(scanResult);

    // 6. Insert Record with upload_mode='assisted_admin'
    const { data: newLink, error: linkError } = await adminSupabase
      .from("drive_links")
      .insert({
        drive_url: urlValidation.canonicalUrl,
        google_file_id: urlValidation.fileId,
        upload_mode: "assisted_admin",
        uploader_user_id: null,
        verification_status: evaluation.status,
        is_hidden: evaluation.isHidden,
        is_removed: false,
      })
      .select()
      .single();

    if (linkError || !newLink) {
      return NextResponse.json(
        { error: `Database error registering link: ${linkError?.message}` },
        { status: 500 }
      );
    }

    // 7. Insert Link Metadata
    const sanitizedTags = Array.isArray(tags)
      ? tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length > 0)
      : [];

    const { error: metadataError } = await adminSupabase.from("link_metadata").insert({
      link_id: newLink.id,
      title: (title || metadata.name).trim(),
      author_name: (authorName || "Community Contributor").trim(),
      fandom: (fandom || "General").trim(),
      pairing: pairing ? pairing.trim() : null,
      rating: rating ? rating.trim() : "Not Rated",
      word_count: 0,
      summary: summary ? summary.trim() : null,
      tags: sanitizedTags,
      canonical_source_url: canonicalSourceUrl ? canonicalSourceUrl.trim() : null,

      file_name: metadata.name,
      mime_type: metadata.mimeType,
      file_size_bytes: metadata.sizeBytes,
      drive_owner_name: metadata.ownerName,
      drive_owner_email: metadata.ownerEmail,
      is_owner_masked: true,
    });

    if (metadataError) {
      await adminSupabase.from("drive_links").delete().eq("id", newLink.id);
      return NextResponse.json(
        { error: `Database error storing metadata: ${metadataError.message}` },
        { status: 500 }
      );
    }

    // 8. Initialize link verification record for Administrator Triage Queue
    const adminNotesCombined = [
      notes ? `Assisted Note: ${notes}` : null,
      evaluation.quarantineReason ? `Threat Flag: ${evaluation.quarantineReason}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    await adminSupabase.from("link_verifications").insert({
      link_id: newLink.id,
      automated_risk_score: scanResult.riskScore,
      automated_flags: scanResult.flags,
      scanner_passed: evaluation.scannerPassed,
      admin_verified_by: null,
      admin_verified_at: null,
      admin_notes: adminNotesCombined || "Submitted via public assisted intake channel.",
      verification_badge: evaluation.badge,
    });

    return NextResponse.json(
      {
        success: true,
        verificationStatus: evaluation.status,
        verificationBadge: evaluation.badge,
        riskScore: scanResult.riskScore,
        message: "Assisted submission received. An administrator will review and verify it for the public archive.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
