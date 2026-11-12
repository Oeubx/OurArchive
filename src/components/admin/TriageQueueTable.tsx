"use client";

import React, { useState } from "react";
import type {
  AdminActionType,
  AdminTriageFeedRecord,
  VerificationStatus,
} from "@/types/database";
import { TriageActionModal } from "@/components/admin/TriageActionModal";

interface TriageQueueTableProps {
  initialItems: AdminTriageFeedRecord[];
}

export function TriageQueueTable({ initialItems }: TriageQueueTableProps) {
  const [items, setItems] = useState<AdminTriageFeedRecord[]>(initialItems);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<AdminActionType | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminTriageFeedRecord | null>(null);

  function handleActionClick(item: AdminTriageFeedRecord, action: AdminActionType) {
    setSelectedItem(item);
    setSelectedAction(action);
  }

  function handleActionSuccess(action: AdminActionType, linkId: string) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.link_id !== linkId) return item;
          if (action === "APPROVE") {
            return {
              ...item,
              verification_status: "verified" as VerificationStatus,
              is_hidden: false,
            };
          }
          if (action === "REJECT") {
            return {
              ...item,
              verification_status: "rejected" as VerificationStatus,
              is_hidden: true,
            };
          }
          if (action === "HIDE") {
            return { ...item, is_hidden: true };
          }
          if (action === "UNHIDE") {
            return { ...item, is_hidden: false };
          }
          return item;
        })
        .filter((item) => {
          if (action === "REMOVE" && item.link_id === linkId) return false;
          return true;
        })
    );
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "flagged") return item.verification_status === "flagged";
    if (filter === "pending_review") return item.verification_status === "pending_review";
    if (filter === "pending_scan") return item.verification_status === "pending_scan";
    if (filter === "hidden") return item.is_hidden;
    return true;
  });

  const statusBadges: Record<string, string> = {
    pending_scan: "bg-amber-100 text-amber-900 border-amber-300",
    pending_review: "bg-blue-100 text-blue-900 border-blue-300",
    verified: "bg-emerald-100 text-emerald-900 border-emerald-300",
    rejected: "bg-gray-100 text-gray-800 border-gray-300",
    flagged: "bg-red-100 text-red-900 border-red-300 animate-pulse",
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">Filter Queue:</span>
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: `All (${items.length})` },
              {
                id: "flagged",
                label: `Flagged (${items.filter((i) => i.verification_status === "flagged").length})`,
              },
              {
                id: "pending_review",
                label: `Pending Review (${items.filter((i) => i.verification_status === "pending_review").length})`,
              },
              {
                id: "pending_scan",
                label: `Pending Scan (${items.filter((i) => i.verification_status === "pending_scan").length})`,
              },
              {
                id: "hidden",
                label: `Hidden (${items.filter((i) => i.is_hidden).length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filter === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-gray-500 text-[11px]">
          Showing <strong>{filteredItems.length}</strong> items in triage
        </span>
      </div>

      {/* Main Review Queue Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="p-3">Fanwork Details</th>
                  <th className="p-3">Drive Descriptor</th>
                  <th className="p-3">Threat Score & Flags</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">6-Action Suite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const flags = Array.isArray(item.automated_flags)
                    ? (item.automated_flags as string[])
                    : [];

                  const riskScore = item.automated_risk_score ?? 0;
                  const scoreColor =
                    riskScore >= 80
                      ? "text-red-700 bg-red-50 border-red-200"
                      : riskScore > 0
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200";

                  return (
                    <tr key={item.link_id} className="hover:bg-gray-50/60 transition">
                      {/* Fanwork title & author */}
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-gray-900 truncate">
                          {item.title || "Untitled Fanwork"}
                        </div>
                        <div className="text-gray-600 text-[11px] truncate">
                          by <strong>{item.author_name || "Unknown"}</strong> • {item.fandom || "General"}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          Submitted: {new Date(item.submitted_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Drive details */}
                      <td className="p-3 font-mono text-[11px] text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800">{item.google_file_id}</span>
                          <a
                            href={item.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-trunk hover:underline"
                            title="Open direct Google Drive link"
                          >
                            🔗
                          </a>
                        </div>
                        <div className="text-[10px] text-gray-500 capitalize">
                          Mode: {item.upload_mode.replace("_", " ")}
                        </div>
                        {item.drive_owner_email && (
                          <div className="text-[10px] text-gray-500 truncate">
                            Owner: {item.drive_owner_email}
                          </div>
                        )}
                      </td>

                      {/* Threat score & flags */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${scoreColor}`}
                          >
                            Risk: {riskScore}/100
                          </span>
                        </div>
                        {flags.length > 0 ? (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {flags.slice(0, 2).map((flag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 bg-red-100 text-red-800 rounded text-[9px] font-mono"
                                title={flag}
                              >
                                {flag.split(":")[0]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 block pt-0.5">
                            ✓ No threat flags
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                              statusBadges[item.verification_status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.verification_status}
                          </span>
                          {item.is_hidden && (
                            <span className="block text-[10px] text-amber-700 font-semibold">
                              🚫 Hidden
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6-Action Suite Buttons */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1 flex-wrap justify-end">
                          <button
                            onClick={() => handleActionClick(item, "VERIFY")}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-medium text-[11px] transition"
                            title="Re-run threat scan and metadata inspection"
                          >
                            🔍 Verify
                          </button>

                          <button
                            onClick={() => handleActionClick(item, "APPROVE")}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-medium text-[11px] transition"
                            title="Approve and publish to public search"
                          >
                            ✅ Approve
                          </button>

                          <button
                            onClick={() => handleActionClick(item, "REJECT")}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-medium text-[11px] transition"
                            title="Reject ineligible fanwork"
                          >
                            ❌ Reject
                          </button>

                          <button
                            onClick={() =>
                              handleActionClick(item, item.is_hidden ? "UNHIDE" : "HIDE")
                            }
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded font-medium text-[11px] transition"
                            title={item.is_hidden ? "Restore visibility" : "Hide from search"}
                          >
                            {item.is_hidden ? "👁️ Unhide" : "🚫 Hide"}
                          </button>

                          <button
                            onClick={() => handleActionClick(item, "CONTACT")}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-medium text-[11px] transition"
                            title="Prepare direct owner outreach email"
                          >
                            ✉️ Contact
                          </button>

                          <button
                            onClick={() => handleActionClick(item, "REMOVE")}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-medium text-[11px] transition"
                            title="Permanently delete fanwork record"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Triage Queue is empty for this filter.</p>
            <p>New submissions requiring safety checks or administrative verification will appear here.</p>
          </div>
        )}
      </div>

      {/* Action Execution Modal */}
      <TriageActionModal
        isOpen={Boolean(selectedAction && selectedItem)}
        action={selectedAction}
        item={selectedItem}
        onClose={() => {
          setSelectedAction(null);
          setSelectedItem(null);
        }}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
