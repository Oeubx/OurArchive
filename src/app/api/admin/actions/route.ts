/**
 * Administrator 6-Action Execution API Endpoint
 * Backlog Items: [OA-M3-F2]
 * Specifications: docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/rbac";
import { executeAdminAction } from "@/lib/services/admin-actions";
import type { AdminActionType } from "@/types/database";

const VALID_ACTIONS: AdminActionType[] = [
  "VERIFY",
  "APPROVE",
  "REJECT",
  "HIDE",
  "UNHIDE",
  "CONTACT",
  "REMOVE",
];

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { linkId, actionType, reason, hardDelete } = body;

    if (!linkId || typeof linkId !== "string") {
      return NextResponse.json(
        { error: "linkId is required and must be a valid UUID string." },
        { status: 400 }
      );
    }

    if (!actionType || !VALID_ACTIONS.includes(actionType as AdminActionType)) {
      return NextResponse.json(
        {
          error: `Invalid actionType. Allowed actions: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await executeAdminAction({
      linkId,
      adminId: user.id,
      actionType: actionType as AdminActionType,
      reason: typeof reason === "string" ? reason.trim() : "",
      hardDelete: Boolean(hardDelete),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
