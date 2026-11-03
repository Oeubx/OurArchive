/**
 * Administrator 6-Action Suite Service
 * Backlog Items: [OA-M3-F2]
 * Specifications: docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 *                 docs/architecture/security_and_verification_pipeline.md
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminActionType,
  VerificationBadge,
  VerificationStatus,
} from "@/types/database";
import { fetchDriveFileMetadata } from "@/lib/services/drive-api";
import { performFullThreatScan } from "@/lib/security/threat-scanner";
import {
  evaluateScanStateMachine,
  resolveBadgeForAdminAction,
} from "@/lib/security/state-machine";

export interface AdminActionParams {
  linkId: string;
  adminId: string;
  actionType: AdminActionType;
  reason: string;
  hardDelete?: boolean;
}

export interface AdminActionResult {
  success: boolean;
  action: AdminActionType;
  linkId: string;
  newStatus?: VerificationStatus;
  badge?: VerificationBadge;
  isHidden?: boolean;
  isRemoved?: boolean;
  contactInfo?: {
    ownerEmail?: string | null;
    ownerName?: string | null;
    mailtoUrl?: string;
  };
  error?: string;
}

/**
 * Executes one of the six Administrator triage actions:
 * 1. VERIFY: Re-triggers automated threat scanning and permission checks.
 * 2. APPROVE: Marks work verified, visible, and awards MANUAL_VERIFIED badge.
 * 3. REJECT: Marks work rejected and hides it from the public index.
 * 4. HIDE: Immediately toggles visibility off without deleting data (supports UNHIDE).
 * 5. CONTACT: Prepares outreach to Drive owner / submitter and logs audit record.
 * 6. REMOVE: Permanently removes the work and cascades associated metadata.
 */
export async function executeAdminAction({
  linkId,
  adminId,
  actionType,
  reason,
  hardDelete = false,
}: AdminActionParams): Promise<AdminActionResult> {
  const adminSupabase = createAdminClient();

  // 1. Fetch target link with its metadata and verification records
  const { data: link, error: linkError } = await adminSupabase
    .from("drive_links")
    .select(`
      id,
      drive_url,
      google_file_id,
      verification_status,
      is_hidden,
      is_removed,
      link_metadata (
        title,
        author_name,
        drive_owner_name,
        drive_owner_email
      ),
      link_verifications (
        id,
        verification_badge,
        automated_risk_score
      )
    `)
    .eq("id", linkId)
    .maybeSingle();

  if (linkError || !link) {
    return {
      success: false,
      action: actionType,
      linkId,
      error: `Drive work not found: ${linkError?.message || "Invalid link ID"}`,
    };
  }

  const metadata = Array.isArray(link.link_metadata)
    ? link.link_metadata[0]
    : link.link_metadata;

  const currentVerification = Array.isArray(link.link_verifications)
    ? link.link_verifications[0]
    : link.link_verifications;

  const currentBadge: VerificationBadge =
    currentVerification?.verification_badge || "UNVERIFIED";

  const now = new Date().toISOString();

  // Helper to record immutable audit log in admin_actions
  const recordAuditLog = async (action: AdminActionType, logReason: string) => {
    await adminSupabase.from("admin_actions").insert({
      link_id: linkId,
      admin_id: adminId,
      action_type: action,
      reason: logReason,
    });
  };

  switch (actionType) {
    case "VERIFY": {
      // Re-query Google Drive API metadata
      const driveResult = await fetchDriveFileMetadata(link.google_file_id);
      if (!driveResult.success || !driveResult.metadata) {
        await recordAuditLog(
          "VERIFY",
          `Verification scan failed: ${driveResult.error || "Permission check failed."}`
        );
        return {
          success: false,
          action: "VERIFY",
          linkId,
          error: driveResult.error || "Failed to inspect Google Drive permissions.",
        };
      }

      // Re-evaluate Threat Scanner & State Machine
      const scanResult = await performFullThreatScan(
        driveResult.metadata,
        link.drive_url
      );
      const evaluation = evaluateScanStateMachine(scanResult);

      // Update Drive Link Record
      await adminSupabase
        .from("drive_links")
        .update({
          verification_status: evaluation.status,
          is_hidden: evaluation.isHidden,
          updated_at: now,
        })
        .eq("id", linkId);

      // Update or insert Verification Record
      if (currentVerification?.id) {
        await adminSupabase
          .from("link_verifications")
          .update({
            automated_risk_score: scanResult.riskScore,
            automated_flags: scanResult.flags,
            scanner_passed: evaluation.scannerPassed,
            verification_badge: evaluation.badge,
            admin_verified_by: adminId,
            admin_verified_at: now,
            admin_notes: reason
              ? `${reason} (Risk Score: ${scanResult.riskScore})`
              : `Admin Re-scan (Risk Score: ${scanResult.riskScore})`,
          })
          .eq("id", currentVerification.id);
      }

      await recordAuditLog(
        "VERIFY",
        reason || `Completed automated threat rescan. Score: ${scanResult.riskScore}/100.`
      );

      return {
        success: true,
        action: "VERIFY",
        linkId,
        newStatus: evaluation.status,
        badge: evaluation.badge,
        isHidden: evaluation.isHidden,
      };
    }

    case "APPROVE": {
      const newBadge = resolveBadgeForAdminAction("APPROVE", currentBadge);

      await adminSupabase
        .from("drive_links")
        .update({
          verification_status: "verified",
          is_hidden: false,
          updated_at: now,
        })
        .eq("id", linkId);

      if (currentVerification?.id) {
        await adminSupabase
          .from("link_verifications")
          .update({
            verification_badge: newBadge,
            admin_verified_by: adminId,
            admin_verified_at: now,
            admin_notes: reason || "Approved for public library index.",
          })
          .eq("id", currentVerification.id);
      }

      await recordAuditLog(
        "APPROVE",
        reason || "Verified fanwork and published to public search feed."
      );

      return {
        success: true,
        action: "APPROVE",
        linkId,
        newStatus: "verified",
        badge: newBadge,
        isHidden: false,
      };
    }

    case "REJECT": {
      await adminSupabase
        .from("drive_links")
        .update({
          verification_status: "rejected",
          is_hidden: true,
          updated_at: now,
        })
        .eq("id", linkId);

      if (currentVerification?.id) {
        await adminSupabase
          .from("link_verifications")
          .update({
            verification_badge: "UNVERIFIED",
            admin_verified_by: adminId,
            admin_verified_at: now,
            admin_notes: reason || "Rejected by administrator.",
          })
          .eq("id", currentVerification.id);
      }

      await recordAuditLog(
        "REJECT",
        reason || "Marked as ineligible for public directory."
      );

      return {
        success: true,
        action: "REJECT",
        linkId,
        newStatus: "rejected",
        badge: "UNVERIFIED",
        isHidden: true,
      };
    }

    case "HIDE": {
      await adminSupabase
        .from("drive_links")
        .update({
          is_hidden: true,
          updated_at: now,
        })
        .eq("id", linkId);

      await recordAuditLog("HIDE", reason || "Link visibility toggled off.");

      return {
        success: true,
        action: "HIDE",
        linkId,
        isHidden: true,
      };
    }

    case "UNHIDE": {
      await adminSupabase
        .from("drive_links")
        .update({
          is_hidden: false,
          updated_at: now,
        })
        .eq("id", linkId);

      await recordAuditLog("UNHIDE", reason || "Link visibility restored.");

      return {
        success: true,
        action: "UNHIDE",
        linkId,
        isHidden: false,
      };
    }

    case "CONTACT": {
      const ownerEmail = metadata?.drive_owner_email || null;
      const ownerName = metadata?.drive_owner_name || null;
      const title = metadata?.title || "Fanwork";

      const subject = encodeURIComponent(`OurArchive Notice: Inquiry regarding "${title}"`);
      const body = encodeURIComponent(
        `Hello ${ownerName || "Author"},\n\nWe are contacting you regarding the Google Drive fanwork "${title}" listed on OurArchive.\n\nNotes: ${reason}\n\nBest regards,\nOurArchive Administration`
      );

      const mailtoUrl = ownerEmail ? `mailto:${ownerEmail}?subject=${subject}&body=${body}` : undefined;

      await recordAuditLog("CONTACT", reason || `Prepared owner contact inquiry for ${ownerEmail || "anonymous owner"}.`);

      return {
        success: true,
        action: "CONTACT",
        linkId,
        contactInfo: {
          ownerEmail,
          ownerName,
          mailtoUrl,
        },
      };
    }

    case "REMOVE": {
      if (hardDelete) {
        // Cascade delete from PostgreSQL
        const { error: deleteError } = await adminSupabase
          .from("drive_links")
          .delete()
          .eq("id", linkId);

        if (deleteError) {
          return {
            success: false,
            action: "REMOVE",
            linkId,
            error: `Failed to expunge record: ${deleteError.message}`,
          };
        }

        return {
          success: true,
          action: "REMOVE",
          linkId,
          isRemoved: true,
        };
      }

      // Soft-delete + Hide (preserves audit log record in admin_actions)
      await adminSupabase
        .from("drive_links")
        .update({
          is_removed: true,
          is_hidden: true,
          updated_at: now,
        })
        .eq("id", linkId);

      await recordAuditLog("REMOVE", reason || "Permanent removal satisfied per administrator protocol.");

      return {
        success: true,
        action: "REMOVE",
        linkId,
        isRemoved: true,
        isHidden: true,
      };
    }

    default:
      return {
        success: false,
        action: actionType,
        linkId,
        error: `Unsupported administrative action: ${actionType}`,
      };
  }
}
