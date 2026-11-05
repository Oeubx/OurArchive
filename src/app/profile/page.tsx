"use client";

import React, { useEffect, useState } from "react";
import { getCurrentProfile, updateDisplayName } from "@/lib/services/profile";
import type { UserProfileRecord } from "@/types/database";
import Link from "next/link";
import {
  getSavedBookmarks,
  removeBookmark,
  subscribeToBookmarks,
  ReaderBookmark,
} from "@/lib/bookmarkService";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);

  useEffect(() => {
    getCurrentProfile().then((data) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setBookmarks(getSavedBookmarks(data.id, false));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToBookmarks(() => {
      setBookmarks(getSavedBookmarks(profile.id, false));
    });
    return unsubscribe;
  }, [profile]);

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

  function handleRemoveBookmark(workId: string) {
    if (!profile) return;
    removeBookmark(workId, profile.id);
    setBookmarks(getSavedBookmarks(profile.id, false));
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
          You must be authenticated to view and manage your contributor profile and reading bookmarks.
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
            Manage your contributor identity, reading bookmarks, and submission metrics.
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

      {/* Profile Overview Card */}
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

      {/* SAVED READING BOOKMARKS SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔖</span>
            <h2 className="text-sm font-bold text-gray-900">Saved Reading Bookmarks</h2>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-mono">
              {bookmarks.length}
            </span>
          </div>
          <span className="text-[11px] text-gray-500">Auto-saved reading progress</span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 space-y-2">
            <p className="text-2xl">📖</p>
            <p className="font-semibold text-gray-700">No saved bookmarks yet</p>
            <p className="max-w-xs mx-auto text-gray-500">
              When reading fanworks in the emergency reader mode, your reading progress and last-read page are saved automatically right here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookmarks.map((b) => (
              <div key={b.workId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/reader/${b.workId}`}
                      className="font-bold text-ao3-red hover:underline text-sm"
                    >
                      {b.workTitle}
                    </Link>
                    <span className="text-gray-500">by {b.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{b.fandom}</span>
                    <span>•</span>
                    <span>Page {b.lastPage} {b.totalPages ? `of ${b.totalPages}` : ""}</span>
                    <span>•</span>
                    <span className="text-ao3-red font-semibold">{b.scrollPercent}% read</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-ao3-red h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${b.scrollPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/reader/${b.workId}`}
                    className="px-3 py-1 bg-ao3-red hover:bg-ao3-darkred text-white font-semibold rounded text-xs transition shadow-2xs"
                  >
                    Resume &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveBookmark(b.workId)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-500 bg-gray-50 p-4 border border-gray-200 rounded">
        <strong>Zero-Download Privacy Notice:</strong> Google Drive links and fanfiction files submitted via OurArchive are streamed ephemerally. Direct Drive URLs are masked from public listings to protect against mass copying and scraping.
      </div>
    </div>
  );
}
