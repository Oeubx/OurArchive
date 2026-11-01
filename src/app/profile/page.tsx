"use client";

import React, { useEffect, useState } from "react";
import { getCurrentProfile, updateDisplayName } from "@/lib/services/profile";
import type { UserProfileRecord } from "@/types/database";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    getCurrentProfile().then((data) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
      }
      setLoading(false);
    });
  }, []);

  async function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const result = await updateDisplayName(displayName);
    if (result.success) {
      setFeedback({ type: "success", message: "Display name updated successfully!" });
      setProfile((prev) => (prev ? { ...prev, display_name: displayName.trim() } : null));
    } else {
      setFeedback({ type: "error", message: result.error || "Failed to update display name" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading archivist profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Sign In Required</h1>
        <p className="text-xs text-gray-600">
          You must be authenticated to view and manage your contributor profile.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-ao3-red text-white text-xs font-semibold rounded hover:bg-ao3-darkred transition"
        >
          Return to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archivist Profile</h1>
          <p className="text-xs text-gray-500">
            Manage your contributor identity and verify archive submission metrics.
          </p>
        </div>
        <span className="text-xs bg-red-100 text-ao3-red px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
          {profile.role}
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {profile.is_banned && (
        <div className="p-4 bg-red-100 border border-red-300 rounded text-red-900 text-xs">
          <strong>Account Flagged:</strong> Your account is currently restricted from submitting new fanwork links. Contact an administrator for assistance.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
        {/* Profile Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-6 text-xs">
          <div>
            <span className="text-gray-500 block">Contributor Status</span>
            <span className="font-semibold text-gray-800">
              {profile.is_banned ? "Restricted" : "Good Standing"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Submissions</span>
            <span className="font-semibold text-gray-800">{profile.submission_count}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Member Since</span>
            <span className="font-semibold text-gray-800">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Display Name Editing Form */}
        <form onSubmit={handleSaveDisplayName} className="space-y-4">
          <div>
            <label htmlFor="display-name-input" className="block text-xs font-semibold text-gray-700">
              Public Display Name
            </label>
            <p className="text-[11px] text-gray-500 mb-1">
              Visible on approved submissions and contributor badges.
            </p>
            <input
              id="display-name-input"
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-ao3-red focus:border-ao3-red outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || displayName.trim() === profile.display_name}
            className="px-4 py-2 bg-ao3-red hover:bg-ao3-darkred text-white text-xs font-semibold rounded transition disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Display Name"}
          </button>
        </form>
      </div>

      <div className="text-[11px] text-gray-500 bg-gray-50 p-4 border border-gray-200 rounded">
        <strong>Zero-Download Privacy Notice:</strong> Google Drive links and fanfiction files submitted via OurArchive are streamed ephemerally. Your email is masked on public cards to protect community privacy.
      </div>
    </div>
  );
}
