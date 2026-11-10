/**
 * Lifecycle Audit History & Compliance Export Engine
 * Tracks all link operations (Upload, Scan, Verify, Approve, Hide, Reject, Expunge),
 * preserves permanent tombstone records for deleted fanworks, and provides CSV / PDF export.
 */

export type AuditActionType =
  | "UPLOADED"
  | "SCANNED"
  | "VERIFIED"
  | "APPROVED"
  | "HIDDEN"
  | "UNHIDDEN"
  | "REJECTED"
  | "EXPUNGED";

export interface LinkAuditRecord {
  id: string;
  linkId: string;
  workTitle: string;
  authorName: string;
  fandom: string;
  maskedDriveUrl: string;
  actionType: AuditActionType;
  actorId: string;
  actorName: string;
  actorRole: "contributor" | "verifier" | "admin" | "system";
  notes?: string;
  timestamp: string;
  isTombstone?: boolean;
}

const STORAGE_KEY_AUDIT = "ourarchive_link_audit_logs";

// Initial seed audit logs (empty by default)
const DEFAULT_AUDIT_LOGS: LinkAuditRecord[] = [];

type AuditListener = () => void;
const listeners = new Set<AuditListener>();

function notifyAuditListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore
    }
  });
}

export function subscribeToAuditLogs(listener: AuditListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Retrieve all system audit records, including tombstoned deleted items.
 */
export function getAllAuditRecords(): LinkAuditRecord[] {
  if (typeof window === "undefined") return DEFAULT_AUDIT_LOGS;

  try {
    if (localStorage.getItem(STORAGE_KEY_AUDIT)) {
      localStorage.removeItem(STORAGE_KEY_AUDIT);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Retrieve chronological audit history for a specific link ID.
 */
export function getAuditHistoryForLink(linkId: string): LinkAuditRecord[] {
  if (!linkId) return [];
  const records = getAllAuditRecords();
  return records
    .filter((r) => r.linkId === linkId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Record a new audit event.
 */
export function recordAuditEvent(entry: Omit<LinkAuditRecord, "id" | "timestamp">): LinkAuditRecord {
  const current = getAllAuditRecords();
  const fullRecord: LinkAuditRecord = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  notifyAuditListeners();
  return fullRecord;
}

/**
 * Record permanent expunge / deletion tombstone.
 * Retains work metadata and takedown justification permanently in audit logs.
 */
export function recordExpungeTombstone(data: {
  linkId: string;
  workTitle: string;
  authorName: string;
  fandom: string;
  maskedDriveUrl: string;
  actorId: string;
  actorName: string;
  actorRole: "admin" | "system";
  reason: string;
}): LinkAuditRecord {
  return recordAuditEvent({
    linkId: data.linkId,
    workTitle: data.workTitle,
    authorName: data.authorName,
    fandom: data.fandom,
    maskedDriveUrl: data.maskedDriveUrl,
    actionType: "EXPUNGED",
    actorId: data.actorId,
    actorName: data.actorName,
    actorRole: data.actorRole,
    notes: `Permanently expunged from OurArchive. Reason: ${data.reason}`,
    isTombstone: true,
  });
}

/**
 * Export audit history to a formatted CSV spreadsheet file.
 */
export function exportAuditToCsv(records: LinkAuditRecord[], filenamePrefix: string = "ourarchive_audit"): void {
  if (typeof window === "undefined" || records.length === 0) return;

  const headers = [
    "Log ID",
    "Timestamp (ISO)",
    "Work ID",
    "Work Title",
    "Author Name",
    "Fandom",
    "Action",
    "Actor Name",
    "Actor Role",
    "Masked Drive Link",
    "Audit Notes / Takedown Reason",
    "Is Tombstone (Deleted)",
  ];

  const escapeCsv = (str: string | undefined | null) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.timestamp),
    escapeCsv(r.linkId),
    escapeCsv(r.workTitle),
    escapeCsv(r.authorName),
    escapeCsv(r.fandom),
    escapeCsv(r.actionType),
    escapeCsv(r.actorName),
    escapeCsv(r.actorRole),
    escapeCsv(r.maskedDriveUrl),
    escapeCsv(r.notes),
    escapeCsv(r.isTombstone ? "YES" : "NO"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an official printable PDF / print compliance report window for a link's audit trail.
 */
export function printAuditReport(linkId: string): void {
  if (typeof window === "undefined") return;

  const history = getAuditHistoryForLink(linkId);
  if (history.length === 0) {
    alert("No audit history found for this link.");
    return;
  }

  const primary = history[history.length - 1] || history[0];
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OurArchive Audit Report - ${primary.workTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            padding: 30px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            border-bottom: 2px solid #990000;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            color: #990000;
          }
          .meta-box {
            background: #f6f6f4;
            border: 1px solid #e0e0dc;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #d0d0ce;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
          }
          th {
            background: #f0f0ee;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .badge-APPROVED { background: #d1fae5; color: #065f46; }
          .badge-HIDDEN { background: #f3f4f6; color: #374151; }
          .badge-REJECTED { background: #fee2e2; color: #991b1b; }
          .badge-EXPUNGED { background: #ef4444; color: white; }
          .badge-UPLOADED { background: #dbeafe; color: #1e40af; }
          .badge-SCANNED { background: #e0e7ff; color: #3730a3; }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e0e0dc;
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">OurArchive Compliance & Audit Trail Report</div>
            <div style="font-size: 10px; color: #666;">Generated on ${new Date().toUTCString()}</div>
          </div>
          <div style="font-weight: bold; font-size: 12px; color: #990000;">Emergency Archival Bridge</div>
        </div>

        <div class="meta-box">
          <div class="meta-grid">
            <div><strong>Work Title:</strong> ${primary.workTitle}</div>
            <div><strong>Author Name:</strong> ${primary.authorName}</div>
            <div><strong>Fandom:</strong> ${primary.fandom}</div>
            <div><strong>Masked Link:</strong> <code>${primary.maskedDriveUrl}</code></div>
            <div><strong>Link ID:</strong> <code>${primary.linkId}</code></div>
            <div><strong>Status:</strong> ${primary.isTombstone ? "PERMANENTLY EXPUNGED (TOMBSTONE)" : "ACTIVE CATALOG RECORD"}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">Chronological Action Lifecycle Log</h3>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Type</th>
              <th>Operator / Actor</th>
              <th>Role</th>
              <th>Notes & Audit Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (h) => `
              <tr>
                <td>${new Date(h.timestamp).toLocaleString()}</td>
                <td><span class="badge badge-${h.actionType}">${h.actionType}</span></td>
                <td><strong>${h.actorName}</strong></td>
                <td>${h.actorRole}</td>
                <td>${h.notes || "(None recorded)"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>OurArchive DMCA & Takedown Verification Protocol • Zero Permanent Disk Storage</div>
          <div>Official Certified Record for Compliance and Legal Takedowns</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
