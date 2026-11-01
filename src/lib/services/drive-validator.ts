/**
 * Google Drive URL Normalization & Validation Service
 * Backlog Items: [OA-M2-F1]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *                 docs/architecture/drive_ingestion_and_search.md
 */

// Canonical regex matching Google Drive and Google Docs URLs
const CANONICAL_DRIVE_REGEX =
  /^https:\/\/(?:drive\.google\.com\/(?:file\/d\/|drive\/folders\/|open\?id=)|docs\.google\.com\/(?:document\/d\/|presentation\/d\/))([a-zA-Z0-9_-]{25,})(?:\/view|\/preview|\/edit|\?.*)?$/i;

// Regex for extracting file ID from various valid Google formats
const FILE_ID_REGEX = /(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/;

// Known URL shortener hosts and cloud storage competitors that are strictly rejected
const PROHIBITED_HOSTS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "mega.nz",
  "mediafire.com",
  "dropbox.com",
  "onedrive.live.com",
];

export interface UrlValidationResult {
  isValid: boolean;
  fileId: string | null;
  canonicalUrl: string | null;
  error?: string;
}

/**
 * Extracts Google Drive or Docs file ID from an arbitrary URL.
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(FILE_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Validates, normalizes, and reconstructs a canonical Google Drive view link.
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

  // Reject prohibited URL shorteners or competitor cloud hosts
  const hostname = parsed.hostname.toLowerCase();
  if (PROHIBITED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "URL shorteners and non-Google Drive cloud links are prohibited.",
    };
  }

  // Validate canonical domain
  if (hostname !== "drive.google.com" && hostname !== "docs.google.com") {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Link must originate from drive.google.com or docs.google.com.",
    };
  }

  // Validate against canonical Google Drive structure
  if (!CANONICAL_DRIVE_REGEX.test(trimmed)) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "URL does not match canonical Google Drive file or document patterns.",
    };
  }

  const fileId = extractGoogleDriveId(trimmed);
  if (!fileId) {
    return {
      isValid: false,
      fileId: null,
      canonicalUrl: null,
      error: "Could not extract a valid Google Drive file ID.",
    };
  }

  const canonicalUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  return {
    isValid: true,
    fileId,
    canonicalUrl,
  };
}
