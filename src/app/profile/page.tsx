"use client";

import React, { useEffect, useState } from "react";
import { getCurrentProfile, updateDisplayName, getLiveSubmissionMetrics, type SubmissionMetrics } from "@/lib/services/profile";
import type { UserProfileRecord } from "@/types/database";
import Link from "next/link";
import { maskWorkId } from "@/lib/utils/idMasker";
import {
  fetchSavedBookmarksFromApi,
  removeBookmarkFromApi,
  buildBookmarkResumeUrl,
  subscribeToBookmarks,
  ReaderBookmark,
} from "@/lib/bookmarkService";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [metrics, setMetrics] = useState<SubmissionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bookmarks State (Supabase-persisted)
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  useEffect(() => {
    getCurrentProfile().then(async (data) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        getLiveSubmissionMetrics(data.id).then(setMetrics).catch(() => {});
        setBookmarksLoading(true);
        try {
          const remoteBookmarks = await fetchSavedBookmarksFromApi();
          setBookmarks(remoteBookmarks);
        } catch {
          setBookmarks([]);
        } finally {
          setBookmarksLoading(false);
        }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToBookmarks(() => {
      fetchSavedBookmarksFromApi()
        .then(setBookmarks)
        .catch(() => {});
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

  async function handleRemoveBookmark(workId: string) {
    if (!profile) return;
    try {
      await removeBookmarkFromApi(workId);
      setBookmarks((prev) => prev.filter((b) => b.workId !== workId));
    } catch {
      // Ignore transient errors
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading archivist profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sign In Required</h1>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          You must be authenticated to view and manage your contributor profile and Supabase reading bookmarks.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-brand-trunk text-white text-xs font-semibold rounded hover:bg-brand-bark transition"
        >
          Return to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-border-light dark:border-border-dark pb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Archivist Profile</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage your contributor identity, reading bookmarks, and submission metrics.
          </p>
        </div>
        <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-brand-bark dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded font-semibold uppercase tracking-wider font-mono">
          {profile.role}
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-lg border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {profile.is_banned && (
        <div className="p-4 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-lg text-red-900 dark:text-red-200 text-xs">
          <strong>Account Flagged:</strong> Your account is currently restricted from submitting new fanwork links. Contact an administrator for assistance.
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs space-y-6 text-gray-900 dark:text-gray-100">
        {/* Profile Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border-light dark:border-border-dark pb-6 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Contributor Status</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {profile.is_banned ? "Restricted" : "Good Standing"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Total Submissions</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {metrics ? (
                <>
                  {metrics.totalSubmissions}{" "}
                  {metrics.totalSubmissions === 1 ? "submission" : "submissions"}{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    ({metrics.totalWorks} indexed {metrics.totalWorks === 1 ? "work" : "works"})
                  </span>
                </>
              ) : (
                profile.submission_count
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Member Since</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Display Name Editing Form */}
        <form onSubmit={handleSaveDisplayName} className="space-y-4">
          <div>
            <label htmlFor="display-name-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Public Display Name
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
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
              className="w-full sm:w-80 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-trunk focus:border-brand-trunk outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={saving || displayName.trim() === profile.display_name}
            className="px-4 py-2 bg-brand-trunk hover:bg-brand-bark text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            {saving && (
              <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 inline text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            )}
            {saving ? "Saving Changes..." : "Save Display Name"}
          </button>
        </form>
      </div>

      {/* SAVED READING BOOKMARKS SECTION */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-xs space-y-4 text-gray-900 dark:text-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔖</span>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Saved Reading Bookmarks</h2>
            <span className="text-xs bg-subtle-light dark:bg-subtle-dark text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-mono border border-border-light dark:border-border-dark">
              {bookmarks.length}
            </span>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Synced with Supabase
          </span>
        </div>

        {bookmarksLoading ? (
          <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
            Loading synced bookmarks from Supabase...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p className="text-2xl">📖</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">No saved bookmarks yet</p>
            <p className="max-w-xs mx-auto text-gray-500 dark:text-gray-400">
              When reading fanworks in the emergency reader mode, click Bookmark (or scroll in HTML stories) to sync checkpoints to your Supabase profile.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {bookmarks.map((b) => {
              const resumeHref = buildBookmarkResumeUrl(maskWorkId(b.workId), b);
              return (
                <div key={b.workId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={resumeHref}
                        className="font-bold text-brand-trunk dark:text-brand-light hover:underline text-sm"
                      >
                        {b.title}
                      </Link>
                      <span className="text-gray-500 dark:text-gray-400">by {b.authorName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="bg-subtle-light dark:bg-subtle-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">
                        {b.fandom}
                      </span>
                      {b.childTitle && (
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Chapter: {b.childTitle}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {b.isPdf ? `PDF Page ${b.lastPage}` : `Page ${b.lastPage}`}
                      </span>
                      {!b.isPdf && (
                        <>
                          <span>•</span>
                          <span className="text-brand-trunk dark:text-brand-light font-semibold">
                            {b.scrollPercent}% read
                          </span>
                        </>
                      )}
                    </div>

                    {!b.isPdf && (
                      <div className="w-full bg-subtle-light dark:bg-subtle-dark rounded-full h-1.5 mt-1.5 overflow-hidden border border-border-light/40 dark:border-border-dark/40">
                        <div
                          className="bg-brand-trunk h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${b.scrollPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={resumeHref}
                      className="px-3 py-1 bg-brand-trunk hover:bg-brand-bark text-white font-semibold rounded text-xs transition shadow-2xs"
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
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-600 dark:text-gray-400 bg-subtle-light dark:bg-subtle-dark/50 p-4 border border-border-light dark:border-border-dark rounded-xl leading-relaxed">
        <strong>Zero-Download Privacy Notice:</strong> Google Drive links and fanfiction files submitted via OurArchive are opened in a temporary view-only stream. Direct Drive URLs are masked from public listings to protect against mass copying and scraping.
      </div>
    </div>
  );
}
