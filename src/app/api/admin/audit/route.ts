/**
 * Admin Audit Trail Query Endpoint
 * Serves live Supabase `admin_actions` records (including purged tombstones)
 * for compliance CSV/PDF exports and per-link audit inspection.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/auth/rbac";
import {
  mapAdminActionRowToAuditRecord,
  type RawAdminActionJoinRow,
} from "@/lib/audit-mapper";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId")?.trim() || null;

    if (linkId && !UUID_REGEX.test(linkId)) {
      return NextResponse.json(
        { error: "Invalid linkId format." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("admin_actions")
      .select(`
        id,
        link_id,
        admin_id,
        action_type,
        reason,
        executed_at,
        work_title_snapshot,
        author_name_snapshot,
        fandom_snapshot,
        masked_url_snapshot,
        is_tombstone,
        user_profiles (
          display_name,
          role
        ),
        drive_links (
          id,
          is_removed,
          link_metadata (
            title,
            author_name,
            fandom
          )
        )
      `)
      .order("executed_at", { ascending: Boolean(linkId) })
      .limit(linkId ? 200 : 1000);

    if (linkId) {
      query = query.eq("link_id", linkId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch audit logs: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = (data || []) as unknown as RawAdminActionJoinRow[];
    const records = rows.map(mapAdminActionRowToAuditRecord);

    return NextResponse.json({ records }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
