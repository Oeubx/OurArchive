/**
 * Immediate Takedown Intake API Endpoint
 * Backlog Items: [OA-M3-F5]
 * Specifications: docs/disclaimers/takedown_and_removal_request.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeDriveUrl } from "@/lib/services/drive-validator";
import { unmaskWorkId, maskWorkId } from "@/lib/utils/idMasker";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ROLES = ["author", "drive_owner", "uploader", "community"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workId,
      targetQuery,
      submittedDriveUrl,
      role,
      requesterEmail,
      ownershipProof,
      reason,
      preference,
    } = body;

    const queryStr = typeof targetQuery === "string" ? targetQuery.trim() : "";
    const driveUrlStr =
      typeof submittedDriveUrl === "string" ? submittedDriveUrl.trim() : "";
    const unmaskedParamId =
      typeof workId === "string" && workId.trim()
        ? unmaskWorkId(workId.trim())
        : "";
    const unmaskedQueryId = queryStr ? unmaskWorkId(queryStr) : "";

    if (!queryStr && !driveUrlStr && !unmaskedParamId) {
      return NextResponse.json(
        {
          error:
            "Please provide the Google Drive URL, Work Title, or Work Reference ID.",
        },
        { status: 400 }
      );
    }

    const proofStr =
      typeof ownershipProof === "string" ? ownershipProof.trim() : "";
    if (!proofStr) {
      return NextResponse.json(
        {
          error:
            "Please provide proof of ownership or credibility details in the verification section.",
        },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Locate the targeted drive work (supporting oa_ masked IDs, UUIDs, Drive URLs, and titles)
    interface MatchedDriveRow {
      id: string;
      drive_url: string;
      link_metadata?:
        | {
            title?: string | null;
            author_name?: string | null;
            fandom?: string | null;
          }
        | Array<{
            title?: string | null;
            author_name?: string | null;
            fandom?: string | null;
          }>
        | null;
    }

    let matchedLink: MatchedDriveRow | null = null;

    const candidateUuid = UUID_REGEX.test(unmaskedParamId)
      ? unmaskedParamId
      : UUID_REGEX.test(unmaskedQueryId)
      ? unmaskedQueryId
      : null;

    if (candidateUuid) {
      const { data: link } = await adminSupabase
        .from("drive_links")
        .select("id, drive_url, link_metadata(title, author_name, fandom)")
        .eq("id", candidateUuid)
        .maybeSingle();

      if (link) {
        matchedLink = link as unknown as MatchedDriveRow;
      }
    }

    // Check by explicit Drive URL input or Drive URL pasted into targetQuery
    if (!matchedLink) {
      const urlCandidate = driveUrlStr || queryStr;
      const parsed = validateAndNormalizeDriveUrl(urlCandidate);
      if (parsed.isValid && parsed.fileId) {
        const { data: links } = await adminSupabase
          .from("drive_links")
          .select("id, drive_url, link_metadata(title, author_name, fandom)")
          .eq("google_file_id", parsed.fileId)
          .eq("is_removed", false)
          .order("created_at", { ascending: true })
          .limit(1);

        if (links && links.length > 0) {
          matchedLink = links[0] as unknown as MatchedDriveRow;
        }
      }
    }

    // Check by Title match in link_metadata
    if (!matchedLink && queryStr) {
      const { data: metas } = await adminSupabase
        .from("link_metadata")
        .select("link_id")
        .ilike("title", queryStr)
        .limit(1);

      const metaLinkId = metas?.[0]?.link_id;
      if (metaLinkId) {
        const { data: link } = await adminSupabase
          .from("drive_links")
          .select("id, drive_url, link_metadata(title, author_name, fandom)")
          .eq("id", metaLinkId)
          .maybeSingle();

        if (link) {
          matchedLink = link as unknown as MatchedDriveRow;
        }
      }
    }

    const matchedMeta = matchedLink?.link_metadata
      ? Array.isArray(matchedLink.link_metadata)
        ? matchedLink.link_metadata[0]
        : matchedLink.link_metadata
      : null;

    const targetLinkId = matchedLink?.id || null;
    const resolvedDriveUrl = matchedLink?.drive_url || null;
    const workTitleSnapshot =
      matchedMeta?.title || (queryStr && !UUID_REGEX.test(unmaskedQueryId) ? queryStr : null);

    // 2. Resolve an admin user profile for audit attribution if immediately quarantining
    const { data: adminProfile } = await adminSupabase
      .from("user_profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    const auditAdminId = adminProfile?.id || null;
    const now = new Date().toISOString();
    const isPermanent = preference !== "hide";
    const normalizedRole = VALID_ROLES.includes(role) ? role : "author";
    const cleanEmail =
      typeof requesterEmail === "string" && requesterEmail.trim()
        ? requesterEmail.trim()
        : null;
    const cleanReason =
      typeof reason === "string" && reason.trim() ? reason.trim() : null;

    // 3. Persist the takedown request in Supabase (matched OR unmatched)
    const { error: requestInsertError } = await adminSupabase
      .from("takedown_requests")
      .insert({
        link_id: targetLinkId,
        target_query: queryStr || driveUrlStr || candidateUuid || "Unspecified",
        submitted_drive_url: driveUrlStr || null,
        resolved_drive_url: resolvedDriveUrl,
        work_title_snapshot: workTitleSnapshot,
        requester_role: normalizedRole,
        requester_email: cleanEmail,
        ownership_proof: proofStr,
        removal_preference: isPermanent ? "permanent" : "hide",
        reason: cleanReason,
        status: targetLinkId ? "quarantined" : "pending",
      });

    if (requestInsertError) {
      return NextResponse.json(
        { error: `Failed to save takedown request: ${requestInsertError.message}` },
        { status: 500 }
      );
    }

    // 4. Execute Immediate Suppression (Zero-Delay Hide; keep is_removed=false so Admin can verify & Purge w/ CSV export)
    if (targetLinkId) {
      await adminSupabase
        .from("drive_links")
        .update({
          is_hidden: true,
          updated_at: now,
        })
        .eq("id", targetLinkId);

      if (auditAdminId) {
        await adminSupabase.from("admin_actions").insert({
          link_id: targetLinkId,
          admin_id: auditAdminId,
          action_type: "HIDE",
          reason: `[IMMEDIATE_TAKEDOWN_REQUEST:${isPermanent ? "PURGE_REQUESTED" : "HIDE_REQUESTED"}] Role: ${normalizedRole} | Contact: ${
            cleanEmail || "anonymous"
          } | Proof: ${proofStr}${cleanReason ? ` | Notes: ${cleanReason}` : ""}`,
          work_title_snapshot: matchedMeta?.title || workTitleSnapshot || "Targeted Work",
          author_name_snapshot: matchedMeta?.author_name || "Unknown Author",
          fandom_snapshot: matchedMeta?.fandom || "General",
          masked_url_snapshot: `/reader/${maskWorkId(targetLinkId)}`,
          is_tombstone: false,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        matched: Boolean(targetLinkId),
        message: targetLinkId
          ? "This fanwork has been hidden from public view right away and logged in the Takedown Queue for final admin review and permanent removal."
          : "Your takedown request and ownership details have been logged in the Takedown Queue for admin review within 24 hours.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
