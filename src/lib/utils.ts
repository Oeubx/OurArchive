/**
 * Utility helpers for formatting, URL masking, and class merging
 */

/**
 * Mask the latter half of a Google Drive URL to prevent raw harvesting
 * Example: https://drive.google.com/file/d/1A2b3c4d5e6f7g8h9i/view -> https://drive.google.com/file/d/1A2b...[omitted]
 */
export function maskDriveUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    
    // Check if it's a file path (/file/d/{id})
    const fileMatch = pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      const fileId = fileMatch[1];
      const prefix = fileId.slice(0, 4);
      return `${parsed.origin}/file/d/${prefix}...[omitted]`;
    }

    // Check if it's an id query param (?id={id})
    const idParam = parsed.searchParams.get("id");
    if (idParam) {
      const prefix = idParam.slice(0, 4);
      return `${parsed.origin}${pathname}?id=${prefix}...[omitted]`;
    }

    // Fallback: preserve first 32 chars and truncate
    if (url.length > 32) {
      return `${url.slice(0, 32)}...[omitted]`;
    }
    return url;
  } catch {
    // If not a valid URL string
    if (url.length > 25) {
      return `${url.slice(0, 25)}...[omitted]`;
    }
    return url;
  }
}

/**
 * Mask owner email for public privacy
 * Example: testuser@gmail.com -> te***@gmail.com
 */
export function maskEmail(email?: string): string {
  if (!email) return "Anonymous / Masked";
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) {
    return "***@" + (domain || "domain.com");
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Format relative time (e.g. "2 hours ago")
 */
export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return isoString;
  }
}
