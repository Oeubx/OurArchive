/**
 * Google Drive REST API v3 Metadata & Permission Verification Service
 * Backlog Items: [OA-M2-F1], [OA-M2-F2]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *                 docs/architecture/drive_ingestion_and_search.md
 */

import { withTimeout } from "@/lib/utils/with-timeout";

export interface GoogleDriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  canEdit: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
}

export interface DriveFetchResult {
  success: boolean;
  metadata?: GoogleDriveFileMetadata;
  error?: string;
  isWritableWarning?: boolean;
}

/**
 * Mask an email address for privacy (e.g. "vol***@gmail.com")
 */
export function maskEmail(email: string | null): string {
  if (!email || !email.includes("@")) return "anonymous";
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
}

/**
 * Queries Google Drive API v3 to inspect file metadata and verify read-only capabilities.
 */
export async function fetchDriveFileMetadata(fileId: string): Promise<DriveFetchResult> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GOOGLE_DRIVE_API_KEY is not configured on the server.",
    };
  }

  const endpoint = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?fields=id,name,mimeType,size,capabilities(canEdit),owners(displayName,emailAddress)&key=${apiKey}`;

  try {
    const response = await withTimeout(
      fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }),
      8000,
      "Google Drive API request timed out."
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Google Drive file not found or not shared publicly (Anyone with the link).",
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: "Access denied. Ensure the Google Drive file permissions are set to 'Anyone with the link can view'.",
        };
      }
      return {
        success: false,
        error: `Google Drive API error: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    const canEdit = Boolean(data.capabilities?.canEdit);
    const primaryOwner = Array.isArray(data.owners) && data.owners.length > 0 ? data.owners[0] : null;

    const metadata: GoogleDriveFileMetadata = {
      id: data.id || fileId,
      name: data.name || "Untitled Fanwork",
      mimeType: data.mimeType || "application/octet-stream",
      sizeBytes: data.size ? parseInt(data.size, 10) : 0,
      canEdit,
      ownerName: primaryOwner?.displayName || null,
      ownerEmail: primaryOwner?.emailAddress || null,
    };

    // Strict Zero-Vandalism / Read-Only Policy:
    // If canEdit is true, link gives edit access to anyone, violating view-only safety.
    if (canEdit) {
      return {
        success: false,
        metadata,
        isWritableWarning: true,
        error: "Google Drive link allows public editing. Please update Drive share settings to 'Viewer' only.",
      };
    }

    return {
      success: true,
      metadata,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to Google Drive API.";
    return {
      success: false,
      error: message,
    };
  }
}
