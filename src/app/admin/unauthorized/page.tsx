import React from "react";
import Link from "next/link";

export default function AdminUnauthorizedPage() {
  return (
    <div className="py-16 max-w-lg mx-auto text-center space-y-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-brand-trunk mb-2">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">403 — Administrator Access Required</h1>
        <p className="text-xs text-gray-600 leading-relaxed">
          The requested administration section is restricted to authorized OurArchive volunteer triage coordinators. Your authenticated account does not possess the required <code className="bg-gray-100 px-1 py-0.5 rounded text-red-700">role = &apos;admin&apos;</code> claim.
        </p>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-left text-xs text-gray-600 space-y-2">
        <span className="font-semibold text-gray-800 block">How to obtain access:</span>
        <ul className="list-disc pl-5 space-y-1">
          <li>Community volunteers handling fanwork verification must have their Discord account or email elevated by a platform administrator.</li>
          <li>If you believe this is in error, contact the OurArchive coordination team.</li>
        </ul>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 bg-brand-trunk text-white text-xs font-semibold rounded hover:bg-brand-bark transition"
        >
          Return to Library
        </Link>
        <Link
          href="/profile"
          className="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-medium rounded hover:bg-gray-200 transition"
        >
          View Your Profile
        </Link>
      </div>
    </div>
  );
}
