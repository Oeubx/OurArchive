import { DriveLink } from "./types";
import { INITIAL_APPROVED_LINKS } from "./seedLinks";

let inMemoryLinks: DriveLink[] = [...INITIAL_APPROVED_LINKS];

/**
 * Fetch all approved links for public search and home feed
 */
export function getApprovedLinks(): DriveLink[] {
  return inMemoryLinks.filter(
    (link) => link.status === "approved"
  );
}

/**
 * Search approved links by query and optional fandom filter
 */
export function searchApprovedLinks(query: string = "", fandom: string = ""): DriveLink[] {
  const q = query.trim().toLowerCase();
  const f = fandom.trim().toLowerCase();

  return inMemoryLinks.filter((link) => {
    if (link.status !== "approved") return false;

    // Fandom filter
    if (f && f !== "all" && link.fandom.toLowerCase() !== f) {
      return false;
    }

    // Text search query
    if (!q) return true;

    const inTitle = link.title.toLowerCase().includes(q);
    const inAuthor = link.authorName.toLowerCase().includes(q);
    const inFandom = link.fandom.toLowerCase().includes(q);
    const inSummary = link.summary.toLowerCase().includes(q);
    const inPairing = link.pairing?.toLowerCase().includes(q) ?? false;
    const inTags = link.tags.some((tag) => tag.toLowerCase().includes(q));

    return inTitle || inAuthor || inFandom || inSummary || inPairing || inTags;
  });
}

/**
 * Fetch a single link by ID
 */
export function getLinkById(id: string): DriveLink | undefined {
  return inMemoryLinks.find((link) => link.id === id);
}

/**
 * Get unique fandom list for filtering
 */
export function getAvailableFandoms(): string[] {
  const set = new Set<string>();
  inMemoryLinks
    .filter((l) => l.status === "approved")
    .forEach((l) => set.add(l.fandom));
  return Array.from(set);
}
