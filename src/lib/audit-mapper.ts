import type { AuditActionType, LinkAuditRecord } from "@/lib/auditService";
import type { AdminActionType } from "@/types/database";
import { maskWorkId } from "@/lib/utils/idMasker";

export interface RawAdminActionJoinRow {
  id: string;
  link_id: string | null;
  admin_id: string;
  action_type: AdminActionType | string;
  reason: string;
  executed_at: string;
  work_title_snapshot?: string | null;
  author_name_snapshot?: string | null;
  fandom_snapshot?: string | null;
  masked_url_snapshot?: string | null;
  is_tombstone?: boolean | null;
  user_profiles?:
    | {
        display_name?: string | null;
        role?: string | null;
      }
    | Array<{
        display_name?: string | null;
        role?: string | null;
      }>
    | null;
  drive_links?:
    | {
        id?: string;
        is_removed?: boolean | null;
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
    | Array<{
        id?: string;
        is_removed?: boolean | null;
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
      }>
    | null;
}

const ACTION_MAP: Record<string, AuditActionType> = {
  VERIFY: "VERIFIED",
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  HIDE: "HIDDEN",
  UNHIDE: "UNHIDDEN",
  CONTACT: "SCANNED",
  REMOVE: "EXPUNGED",
};

function unwrapSingle<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] ?? null : val;
}

/**
 * Normalizes a Supabase `admin_actions` row (with optional profile/link joins)
 * into a UI-ready `LinkAuditRecord`, falling back to snapshot columns for purged tombstones.
 */
export function mapAdminActionRowToAuditRecord(
  row: RawAdminActionJoinRow
): LinkAuditRecord {
  const actor = unwrapSingle(row.user_profiles);
  const link = unwrapSingle(row.drive_links);
  const meta = unwrapSingle(link?.link_metadata);

  const normalizedRole =
    actor?.role === "admin" ||
    actor?.role === "verifier" ||
    actor?.role === "contributor"
      ? actor.role
      : "admin";

  const maskedToken = row.link_id ? maskWorkId(row.link_id) : "expunged";

  return {
    id: row.id,
    linkId: row.link_id || "purged-record",
    workTitle:
      meta?.title || row.work_title_snapshot || "Expunged / Archived Work",
    authorName:
      meta?.author_name || row.author_name_snapshot || "Unknown Author",
    fandom: meta?.fandom || row.fandom_snapshot || "General",
    maskedDriveUrl:
      row.masked_url_snapshot || `/reader/${maskedToken}`,
    actionType: ACTION_MAP[row.action_type] || "VERIFIED",
    actorId: row.admin_id,
    actorName: actor?.display_name || "Administrator",
    actorRole: normalizedRole,
    notes: row.reason,
    timestamp: row.executed_at,
    isTombstone: Boolean(row.is_tombstone || row.action_type === "REMOVE" || link?.is_removed),
  };
}
