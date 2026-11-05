/**
 * Reading Bookmark & Page Progress Persistence Engine
 * Saves and restores reading position for authenticated users (Contributors, Verifiers, Admins).
 * Gracefully disabled for anonymous Guests.
 */

export interface ReaderBookmark {
  workId: string;
  workTitle: string;
  authorName: string;
  fandom: string;
  rating: string;
  lastPage: number;
  totalPages?: number;
  scrollPercent: number; // 0 - 100
  lastReadAt: string;
}

const STORAGE_KEY_PREFIX = "ourarchive_bookmarks_";

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

function getStorageKey(userId?: string): string {
  return `${STORAGE_KEY_PREFIX}${userId || "authenticated_user"}`;
}

/**
 * Retrieve all saved bookmarks for the active user.
 * Returns empty array for anonymous guests.
 */
export function getSavedBookmarks(userId?: string, isGuest: boolean = false): ReaderBookmark[] {
  if (isGuest || typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Retrieve bookmark for a specific work ID.
 */
export function getBookmarkForWork(
  workId: string,
  userId?: string,
  isGuest: boolean = false
): ReaderBookmark | null {
  if (isGuest || !workId) return null;
  const bookmarks = getSavedBookmarks(userId, isGuest);
  return bookmarks.find((b) => b.workId === workId) || null;
}

/**
 * Save or update reading progress for a work.
 * Skips saving if the user is an anonymous guest.
 */
export function saveReadingProgress(
  bookmark: ReaderBookmark,
  userId?: string,
  isGuest: boolean = false
): boolean {
  if (isGuest || typeof window === "undefined") return false;

  try {
    const key = getStorageKey(userId);
    const existing = getSavedBookmarks(userId, isGuest);
    const filtered = existing.filter((b) => b.workId !== bookmark.workId);

    const updated = [
      {
        ...bookmark,
        lastReadAt: new Date().toISOString(),
      },
      ...filtered,
    ];

    // Cap saved bookmarks at 50 most recent
    const capped = updated.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(capped));
    notifyBookmarkListeners();
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a bookmark for a specific work.
 */
export function removeBookmark(
  workId: string,
  userId?: string,
  isGuest: boolean = false
): boolean {
  if (isGuest || typeof window === "undefined") return false;

  try {
    const key = getStorageKey(userId);
    const existing = getSavedBookmarks(userId, isGuest);
    const filtered = existing.filter((b) => b.workId !== workId);
    localStorage.setItem(key, JSON.stringify(filtered));
    notifyBookmarkListeners();
    return true;
  } catch {
    return false;
  }
}
