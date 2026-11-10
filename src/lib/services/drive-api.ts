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

export interface DriveChildWork {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  cleanTitle: string;
}

export interface DriveFolderChildrenResult {
  success: boolean;
  folderName?: string;
  children?: DriveChildWork[];
  error?: string;
}

export interface DriveFetchResult {
  success: boolean;
  metadata?: GoogleDriveFileMetadata;
  error?: string;
  isWritableWarning?: boolean;
}

/**
 * Normalizes and cleans a filename into a human-readable fanwork title.
 * Strips common file extensions and leading chapter/track indices.
 */
export function cleanFilenameToTitle(filename: string): string {
  if (!filename) return "Untitled Fanwork";
  // Strip file extension
  let clean = filename.replace(/\.(pdf|docx?|txt|epub|rtf|html?)$/i, "").trim();
  // Strip common leading indices (e.g. "01 - ", "1. ", "Ch 01 - ", "Chapter 1: ")
  clean = clean.replace(/^(?:(?:ch(?:apter)?\.?\s*\d+)|(?:\d+[\.\-_]))\s*[:\-–—]?\s*/i, "").trim();
  if (!clean) {
    clean = filename.replace(/\.(pdf|docx?|txt|epub|rtf|html?)$/i, "").trim();
  }
  return clean || "Untitled Fanwork";
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

/**
 * Inspects a public Google Drive folder and queries all readable child documents.
 * Discovers individual fanworks (PDFs, Google Docs, Word Docs) inside shared folders.
 */
export async function fetchDriveFolderChildren(folderId: string): Promise<DriveFolderChildrenResult> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GOOGLE_DRIVE_API_KEY is not configured on the server.",
    };
  }

  try {
    // 1. Fetch folder metadata (name)
    let folderName = "Shared Fanwork Folder";
    const folderMetaEndpoint = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      folderId
    )}?fields=id,name,mimeType&key=${apiKey}`;

    const folderRes = await withTimeout(
      fetch(folderMetaEndpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      4000,
      "Folder metadata request timed out."
    ).catch(() => null);

    if (folderRes && folderRes.ok) {
      const folderData = await folderRes.json();
      if (folderData.name) {
        folderName = folderData.name;
      }
    }

    // 2. Query child files: `'folderId' in parents and trashed = false`
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const listEndpoint = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size)&pageSize=100&orderBy=name&key=${apiKey}`;

    const listRes = await withTimeout(
      fetch(listEndpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      6000,
      "Folder children query timed out."
    );

    if (!listRes.ok) {
      return {
        success: false,
        folderName,
        error: `Could not list folder contents (HTTP ${listRes.status}). Ensure the folder permissions are set to 'Anyone with the link can view'.`,
      };
    }

    const listData = await listRes.json();
    const rawFiles: Array<{ id?: string; name?: string; mimeType?: string; size?: string }> = Array.isArray(listData.files) ? listData.files : [];

    // Filter readable documents (ignore folders and binary executables)
    const validChildren: DriveChildWork[] = [];
    const supportedExtensions = /\.(pdf|docx?|txt|epub|rtf|html?)$/i;

    for (const f of rawFiles) {
      if (!f.id || !f.name) continue;
      const mime = f.mimeType || "";
      const isDoc =
        mime === "application/pdf" ||
        mime === "application/vnd.google-apps.document" ||
        mime.includes("word") ||
        mime.includes("text") ||
        supportedExtensions.test(f.name);

      // Exclude subfolders and zip/executables
      if (mime.includes("folder") || mime.includes("zip") || (mime.includes("octet-stream") && !supportedExtensions.test(f.name))) {
        continue;
      }

      if (isDoc) {
        validChildren.push({
          id: f.id,
          name: f.name,
          mimeType: mime || (f.name.endsWith(".pdf") ? "application/pdf" : "application/vnd.google-apps.document"),
          sizeBytes: f.size ? parseInt(f.size, 10) : 0,
          cleanTitle: cleanFilenameToTitle(f.name),
        });
      }
    }

    return {
      success: true,
      folderName,
      children: validChildren,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to query Google Drive folder contents.";
    return {
      success: false,
      error: message,
    };
  }
}
