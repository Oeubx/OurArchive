/**
 * Google Drive URL Normalization & Validation Service
 * Backlog Items: [OA-M2-F1]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *                 docs/architecture/drive_ingestion_and_search.md
 */

// Canonical regex matching Google Drive files, folders, and Google Docs URLs
const CANONICAL_DRIVE_REGEX =
  /^https:\/\/(?:drive\.google\.com\/(?:file\/d\/|drive(?:\/u\/\d+)?\/folders\/|folders\/|folder\/d\/|open\?id=)|docs\.google\.com\/(?:document\/d\/|presentation\/d\/|spreadsheets\/d\/))([a-zA-Z0-9_-]{15,})(?:\/view|\/preview|\/edit|\?.*)?$/i;

// Regex for extracting file or folder ID from various valid Google formats
const DRIVE_RESOURCE_REGEX = /(?:\/d\/|id=|\/folders\/)([a-zA-Z0-9_-]{15,})/;

// Known URL shortener hosts and competitor hosts that are strictly rejected (OneDrive permitted)
const PROHIBITED_HOSTS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "mega.nz",
  "mediafire.com",
  "dropbox.com",
];

export interface UrlValidationResult {
  isValid: boolean;
  fileId: string | null;
  canonicalUrl: string | null;
  isFolder?: boolean;
  error?: string;
}

/**
 * Extracts Google Drive file or folder ID from an arbitrary URL.
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(DRIVE_RESOURCE_REGEX);
  return match ? match[1] : null;
}

/**
 * Validates, normalizes, and reconstructs a canonical Google Drive or cloud drive link.
 */
export function validateAndNormalizeDriveUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "A valid URL string is required.",
    };
  }

  const trimmed = rawUrl.trim();

  // Strip dangerous schemes
  if (
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:") ||
    trimmed.toLowerCase().startsWith("vbscript:")
  ) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Dangerous URL scheme detected.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Invalid URL format.",
    };
  }

  // Enforce HTTPS
  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Only secure HTTPS URLs are permitted.",
    };
  }

  // Reject prohibited URL shorteners or dangerous hosts
  const hostname = parsed.hostname.toLowerCase();
  if (PROHIBITED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Prohibited cloud host or URL shortener detected.",
    };
  }

  // Support OneDrive links
  if (hostname === "onedrive.live.com" || hostname === "1drv.ms") {
    const isFolder = trimmed.includes("resid=") || trimmed.includes("cid=") || trimmed.toLowerCase().includes("folder");
    return {
      isValid: true,
      fileId: `onedrive_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      canonicalUrl: trimmed,
      isFolder,
    };
  }

  // Validate canonical domain for Google Drive
  if (hostname !== "drive.google.com" && hostname !== "docs.google.com") {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Link must originate from drive.google.com, docs.google.com, or OneDrive.",
    };
  }

  // Check if it's a folder link
  const isFolder =
    parsed.pathname.includes("/folders/") ||
    parsed.pathname.includes("drive/folders") ||
    parsed.searchParams.get("folder") !== null;

  const fileId = extractGoogleDriveId(trimmed);
  if (!fileId) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Could not extract a valid Google Drive file or folder ID.",
    };
  }

  const canonicalUrl = isFolder
    ? `https://drive.google.com/drive/folders/${fileId}`
    : `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  return {
    isValid: true,
    fileId,
    canonicalUrl,
    isFolder,
  };
}
