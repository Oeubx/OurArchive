import React from "react";
import { requireAdmin } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch top 10 pending triage items
  const { data: triageQueue } = await supabase
    .from("drive_links")
    .select(`
      id,
      drive_url,
      google_file_id,
      upload_mode,
      verification_status,
      created_at
    `)
    .in("verification_status", ["pending_scan", "pending_review", "flagged"])
    .order("created_at", { ascending: true })
    .limit(10);

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

      {/* Triage Queue Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Priority Triage Review Queue</h2>
          <span className="text-xs text-gray-500">Module 3 6-Action Suite Integration</span>
        </div>

        {triageQueue && triageQueue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="p-3">File ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {triageQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-[11px] text-gray-700">{item.google_file_id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">
                        {item.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 capitalize">{item.upload_mode}</td>
                    <td className="p-3 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className="text-gray-400 text-[11px]">Triage Actions in Module 3</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Triage Queue is currently empty.</p>
            <p>New submissions requiring safety checks or administrative verification will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
