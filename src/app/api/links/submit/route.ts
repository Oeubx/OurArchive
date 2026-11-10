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
import { fetchDriveFileMetadata, fetchDriveFolderChildren } from "@/lib/services/drive-api";
import type { GoogleDriveFileMetadata, DriveChildWork } from "@/lib/services/drive-api";
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
      isPriorVerified,
      uploadMode,
    } = body;

    // 1. Cloudflare Turnstile Bot Defense (Gracefully non-blocking if unconfigured)
    if (turnstileToken && process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: turnstileResult.error || "Turnstile bot verification failed." },
          { status: 400 }
        );
      }
    }

    // 2. Validate Contributor Account Status & Velocity Limits
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("user_profiles")
      .select("id, is_banned, role, display_name, submission_count")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json(
        { error: "Your contributor account is suspended from submitting fanworks." },
        { status: 403 }
      );
    }

    const isUserAdmin = profile?.role === "admin" || (user.app_metadata as Record<string, unknown> | undefined)?.role === "admin";

    // Velocity Limit: Max 10 submissions per hour per user account (relaxed for admins)
    if (!isUserAdmin) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentSubmissionsCount } = await adminSupabase
        .from("drive_links")
        .select("*", { count: "exact", head: true })
        .eq("uploader_user_id", user.id)
        .gte("created_at", oneHourAgo);

      if ((recentSubmissionsCount || 0) >= 10) {
        return NextResponse.json(
          { error: "Upload velocity limit reached: maximum 10 submissions per hour." },
          { status: 429 }
        );
      }
    }

    // 3. Validate Canonical Drive / Cloud Folder URL
    const urlValidation = validateAndNormalizeDriveUrl(driveUrl);
    if (!urlValidation.isValid || !urlValidation.fileId || !urlValidation.canonicalUrl) {
      return NextResponse.json(
        { error: urlValidation.error || "Invalid Google Drive or cloud drive link." },
        { status: 400 }
      );
    }

    // 4. Inspect Google Drive API Metadata or generate safe fallback
    let metadata: GoogleDriveFileMetadata | undefined;
    let folderChildren: DriveChildWork[] = [];
    let detectedCollectionName = (title || "").trim();

    if (process.env.GOOGLE_DRIVE_API_KEY && !driveUrl.includes("onedrive")) {
      if (urlValidation.isFolder) {
        // Solution A: Inspect and unpack Google Drive folder collections
        const folderResult = await fetchDriveFolderChildren(urlValidation.fileId);
        if (folderResult.success && folderResult.children && folderResult.children.length > 0) {
          folderChildren = folderResult.children;
          if (folderResult.folderName && !detectedCollectionName) {
            detectedCollectionName = folderResult.folderName;
          }
        }
      } else {
        const driveResult = await fetchDriveFileMetadata(urlValidation.fileId);
        if (driveResult.success && driveResult.metadata) {
          metadata = driveResult.metadata;
        }
      }
    }

    if (!metadata) {
      metadata = {
        id: urlValidation.fileId,
        name: (detectedCollectionName || (urlValidation.isFolder ? "Curated Fanwork Collection" : "Shared Fanwork Document")).trim(),
        mimeType: urlValidation.isFolder ? "application/vnd.google-apps.folder" : "application/pdf",
        sizeBytes: 0,
        canEdit: false,
        ownerName: profile?.display_name || (user.user_metadata?.full_name as string) || null,
        ownerEmail: null,
      };
    }

    // 5. Automated Threat Scan & State Machine Evaluation [OA-M3-F1, OA-M3-F3]
    const scanResult = await performFullThreatScan(metadata, urlValidation.canonicalUrl);
    const evaluation = evaluateScanStateMachine(scanResult);

    // Direct Approved Override: ONLY allowed if submitted by an authorized Admin AND isPriorVerified is explicitly true
    const allowDirectApproval = isUserAdmin && Boolean(isPriorVerified);
    const effectiveStatus: "verified" | typeof evaluation.status = allowDirectApproval ? "verified" : evaluation.status;
    const effectiveHidden = allowDirectApproval ? false : evaluation.isHidden;
    const effectiveBadge = allowDirectApproval ? "MANUAL_VERIFIED" : evaluation.badge;

    // Determine upload_mode: "assisted_admin" if uploaded by admin via direct upload, otherwise "authenticated"
    const effectiveUploadMode = isUserAdmin && uploadMode === "assisted_admin" ? "assisted_admin" : "authenticated";

    // 6. Insert Drive Link Record
    const { data: newLink, error: linkError } = await adminSupabase
      .from("drive_links")
      .insert({
        drive_url: urlValidation.canonicalUrl,
        google_file_id: urlValidation.fileId,
        upload_mode: effectiveUploadMode,
        uploader_user_id: user.id,
        verification_status: effectiveStatus,
        is_hidden: effectiveHidden,
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

    // 7. Insert Link Metadata Record
    const sanitizedTags = Array.isArray(tags)
      ? tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length > 0)
      : [];

    const effectiveDisplayName = profile?.display_name || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Contributor";

    const { error: metadataError } = await adminSupabase.from("link_metadata").insert({
      link_id: newLink.id,
      title: (title || metadata.name).trim(),
      author_name: (authorName || effectiveDisplayName).trim(),
      fandom: (fandom || "General Fanworks").trim(),
      pairing: pairing ? pairing.trim() : null,
      rating: rating ? rating.trim() : "General Audiences",
      word_count: typeof wordCount === "number" && wordCount >= 0 ? wordCount : 0,
      summary: summary ? summary.trim() : null,
      tags: sanitizedTags,
      canonical_ao3_url: canonicalAo3Url ? canonicalAo3Url.trim() : null,

      file_name: metadata.name,
      mime_type: metadata.mimeType,
      file_size_bytes: metadata.sizeBytes,
      drive_owner_name: metadata.ownerName || effectiveDisplayName,
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

    // 8. Record Link Verification and Risk Evaluation Metrics [OA-M3-F1, OA-M3-F3]
    await adminSupabase.from("link_verifications").insert({
      link_id: newLink.id,
      automated_risk_score: scanResult.riskScore,
      automated_flags: scanResult.flags,
      scanner_passed: scanResult.riskScore === 0,
      admin_verified_by: allowDirectApproval ? user.id : null,
      admin_verified_at: allowDirectApproval ? new Date().toISOString() : null,
      admin_notes: allowDirectApproval
        ? "Direct administrator upload with prior verification bypass (auto-verified override)."
        : evaluation.quarantineReason || null,
      verification_badge: effectiveBadge,
    });

    // 9. Increment Contributor Submission Count
    if (profile) {
      await adminSupabase
        .from("user_profiles")
        .update({ submission_count: (profile.submission_count || 0) + 1 })
        .eq("id", user.id);
    }

    // 10. Solution A: Unpack and Index Individual Child Fanworks from Collection Folder
    let unpackedCount = 0;
    if (folderChildren.length > 0) {
      const collectionTag = `collection:${detectedCollectionName || "Curated Archive"}`;
      for (const child of folderChildren) {
        try {
          const childDriveUrl = `https://drive.google.com/file/d/${child.id}/view`;
          const { data: childLink } = await adminSupabase
            .from("drive_links")
            .insert({
              drive_url: childDriveUrl,
              google_file_id: child.id,
              upload_mode: effectiveUploadMode,
              uploader_user_id: user.id,
              verification_status: effectiveStatus,
              is_hidden: effectiveHidden,
              is_removed: false,
            })
            .select()
            .single();

          if (childLink) {
            await adminSupabase.from("link_metadata").insert({
              link_id: childLink.id,
              title: child.cleanTitle,
              author_name: (authorName || effectiveDisplayName).trim(),
              fandom: (fandom || "General Fanworks").trim(),
              pairing: pairing ? pairing.trim() : null,
              rating: rating ? rating.trim() : "General Audiences",
              word_count: 0,
              summary: summary
                ? `${summary.trim()}\n(Part of collection: ${detectedCollectionName || "Curated Archive"})`
                : `Part of collection: ${detectedCollectionName || "Curated Archive"}`,
              tags: Array.from(new Set([...sanitizedTags, collectionTag])),
              canonical_ao3_url: canonicalAo3Url ? canonicalAo3Url.trim() : urlValidation.canonicalUrl,
              file_name: child.name,
              mime_type: child.mimeType,
              file_size_bytes: child.sizeBytes,
              drive_owner_name: effectiveDisplayName,
              drive_owner_email: metadata.ownerEmail,
              is_owner_masked: isOwnerMasked !== false,
            });

            await adminSupabase.from("link_verifications").insert({
              link_id: childLink.id,
              automated_risk_score: scanResult.riskScore,
              automated_flags: scanResult.flags,
              scanner_passed: scanResult.riskScore === 0,
              admin_verified_by: allowDirectApproval ? user.id : null,
              admin_verified_at: allowDirectApproval ? new Date().toISOString() : null,
              admin_notes: allowDirectApproval
                ? "Auto-verified collection child work."
                : evaluation.quarantineReason || null,
              verification_badge: effectiveBadge,
            });

            unpackedCount += 1;
          }
        } catch (childErr) {
          console.warn(`Could not unpack child fanwork ${child.name}:`, childErr);
        }
      }
    }

    const message = unpackedCount > 0
      ? `Collection submitted successfully! Unpacked and indexed ${unpackedCount} individual fanworks into library search.`
      : allowDirectApproval
      ? "Fanwork published directly to the public archive."
      : evaluation.status === "flagged"
      ? "Work submitted and quarantined due to safety flags. An administrator will review it before release."
      : "Fanwork submitted successfully. In queue for automated verification.";

    return NextResponse.json(
      {
        success: true,
        workId: newLink.id,
        verificationStatus: effectiveStatus,
        verificationBadge: effectiveBadge,
        riskScore: scanResult.riskScore,
        isCollection: folderChildren.length > 0,
        unpackedCount,
        message,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
