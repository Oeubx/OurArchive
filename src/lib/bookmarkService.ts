/**
 * Reading Bookmark & Page Progress Persistence Engine
 * Persists authenticated user reading bookmarks in Supabase (`public.user_bookmarks` via `/api/bookmarks`).
 */

export interface ReaderBookmark {
  workId: string;
  title: string;
  authorName: string;
  fandom: string;
  scrollPercent: number; // 0 to 100
  lastPage: number; // Estimated reading page or manual PDF page checkpoint
  updatedAt: string;
  isPdf?: boolean;
  childId?: string;
  childTitle?: string;
  childMimeType?: string;
}

type BookmarkListener = () => void;
const listeners = new Set<BookmarkListener>();

function notifyBookmarkListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore
    }
  });
}

export function subscribeToBookmarks(listener: BookmarkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Fetch all Supabase-saved bookmarks for the currently signed-in user.
 */
export async function fetchSavedBookmarksFromApi(): Promise<ReaderBookmark[]> {
  if (typeof window === "undefined") return [];
  const res = await fetch("/api/bookmarks", { cache: "no-store" });
  if (res.status === 401) return [];
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch bookmarks.");
  }
  const data = await res.json();
  return Array.isArray(data.bookmarks) ? data.bookmarks : [];
}

/**
 * Fetch the Supabase-saved bookmark for a specific work ID.
 */
export async function fetchBookmarkForWorkFromApi(
  workId: string
): Promise<ReaderBookmark | null> {
  if (typeof window === "undefined" || !workId) return null;
  const res = await fetch(
    `/api/bookmarks?workId=${encodeURIComponent(workId)}`,
    { cache: "no-store" }
  );
  if (res.status === 401 || !res.ok) return null;
  const data = await res.json();
  return data.bookmark || null;
}

/**
 * Save or update a reading bookmark in Supabase.
 */
export async function saveBookmarkToApi(
  bookmark: ReaderBookmark
): Promise<ReaderBookmark | null> {
  if (typeof window === "undefined" || !bookmark.workId) return null;
  const res = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookmark),
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save bookmark.");
  }
  const data = await res.json();
  notifyBookmarkListeners();
  return data.bookmark || null;
}

/**
 * Delete a saved bookmark from Supabase.
 */
export async function removeBookmarkFromApi(workId: string): Promise<boolean> {
  if (typeof window === "undefined" || !workId) return false;
  const res = await fetch(
    `/api/bookmarks?workId=${encodeURIComponent(workId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to remove bookmark.");
  }
  notifyBookmarkListeners();
  return true;
}

/**
 * Helper to generate resume URL for a bookmark (supporting collection child checkpoints).
 */
export function buildBookmarkResumeUrl(
  maskedOrRawWorkId: string,
  bookmark: Pick<ReaderBookmark, "childId" | "childTitle" | "childMimeType">
): string {
  const base = `/reader/${maskedOrRawWorkId}`;
  if (!bookmark.childId) return base;
  const params = new URLSearchParams({ childId: bookmark.childId });
  if (bookmark.childTitle) params.set("childTitle", bookmark.childTitle);
  if (bookmark.childMimeType) params.set("mimeType", bookmark.childMimeType);
  return `${base}?${params.toString()}`;
}
