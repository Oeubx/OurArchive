import React from "react";
import { requireAdmin } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { TriageQueueTable } from "@/components/admin/TriageQueueTable";
import type { AdminTriageFeedRecord } from "@/types/database";

export default async function AdminDashboardPage() {
  const { user } = await requireAdmin();
  const supabase = createClient();

  // Fetch count aggregations for triage queue
  const [
    { count: totalCount },
    { count: pendingScanCount },
    { count: pendingReviewCount },
    { count: verifiedCount },
    { count: flaggedCount },
  ] = await Promise.all([
    supabase.from("drive_links").select("*", { count: "exact", head: true }),
    supabase.from("drive_links").select("*", { count: "exact", head: true }).eq("verification_status", "pending_scan"),
    supabase.from("drive_links").select("*", { count: "exact", head: true }).eq("verification_status", "pending_review"),
    supabase.from("drive_links").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("drive_links").select("*", { count: "exact", head: true }).eq("verification_status", "flagged"),
  ]);

  // Fetch triage queue from vw_admin_triage_feed view
  const { data: triageItems } = await supabase
    .from("vw_admin_triage_feed")
    .select("*")
    .order("submitted_at", { ascending: true })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Administrator Status Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-lg text-xs">
        <div>
          <span className="text-gray-500">Active Administrator:</span>{" "}
          <strong className="text-gray-900">{user.email}</strong>
        </div>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[11px]">
          RBAC: admin (authorized)
        </span>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-2xs">
          <span className="text-gray-500 text-[11px] block uppercase font-medium">Pending Scan</span>
          <span className="text-2xl font-bold text-amber-600">{pendingScanCount ?? 0}</span>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-2xs">
          <span className="text-gray-500 text-[11px] block uppercase font-medium">Pending Review</span>
          <span className="text-2xl font-bold text-blue-600">{pendingReviewCount ?? 0}</span>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-2xs">
          <span className="text-gray-500 text-[11px] block uppercase font-medium">Flagged</span>
          <span className="text-2xl font-bold text-red-600">{flaggedCount ?? 0}</span>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-2xs">
          <span className="text-gray-500 text-[11px] block uppercase font-medium">Verified Active</span>
          <span className="text-2xl font-bold text-emerald-600">{verifiedCount ?? 0}</span>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-2xs">
          <span className="text-gray-500 text-[11px] block uppercase font-medium">Total Ingested</span>
          <span className="text-2xl font-bold text-gray-800">{totalCount ?? 0}</span>
        </div>
      </div>

      {/* Priority Triage Review Queue with Module 3 6-Action Suite */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-gray-900">Priority Triage Review Queue</h2>
          <span className="text-xs text-gray-500">Administrator 6-Action Suite Active</span>
        </div>

        <TriageQueueTable
          initialItems={(triageItems || []) as AdminTriageFeedRecord[]}
        />
      </div>
    </div>
  );
}
