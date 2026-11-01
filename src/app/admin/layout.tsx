import React from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 text-white p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">OurArchive Admin Console</span>
            <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Triage Mode
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Emergency mirror verification, fanwork threat quarantine, and DMCA takedowns.
          </p>
        </div>

        <nav className="flex items-center gap-2 text-xs">
          <Link
            href="/admin"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition font-medium"
          >
            Review Queue
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition font-medium"
          >
            Telemetry
          </Link>
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
