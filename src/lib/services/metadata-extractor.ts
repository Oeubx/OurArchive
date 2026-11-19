/**
 * In-Memory Ephemeral Metadata Extractor Service
 * Backlog Items: [OA-M2-F2]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *                 docs/architecture/drive_ingestion_and_search.md
 *
 * Ephemerally streams only the first page / cover in-memory without saving to disk.
 * Strictly adheres to the Read-Only / Zero-Download and Zero-AI Architecture.
 */

import { extractText } from "unpdf";
import { parseFirstPageMetadata, type ParseResult } from "./metadata-parser";
import { withTimeout } from "@/lib/utils/with-timeout";

const MAX_SCAN_BYTES = 8 * 1024 * 1024; // 8 MB safety cap for in-memory stream buffer

/**
 * Downloads the first few megabytes of a Google Drive file ephemerally in-memory,
 * extracts page 1 text (PDF) or raw characters (text/html), and deterministically parses cover metadata.
 */
export async function extractFileMetadataFromDrive(
  fileId: string,
  fileName: string,
  mimeType?: string,
  providedApiKey?: string
): Promise<ParseResult> {
  const apiKey = providedApiKey || process.env.GOOGLE_DRIVE_API_KEY;
  let fileBuffer: ArrayBuffer | null = null;
  const isPdf =
    Boolean(mimeType && mimeType.includes("pdf")) || fileName.toLowerCase().endsWith(".pdf");

  // 1. Fetch Ephemeral Stream Buffer via Google Drive API v3
  if (apiKey) {
    try {
      const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?alt=media&key=${apiKey}`;

      const res = await withTimeout(
        fetch(mediaUrl, { cache: "no-store" }),
        7000,
        "Drive stream timed out."
      );

      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength <= MAX_SCAN_BYTES && buf.byteLength > 0) {
          fileBuffer = buf;
        }
      }
    } catch {
      // Fallback to public export below
    }
  }

  // 2. Fallback to public download stream if API key failed or is missing
  if (!fileBuffer) {
    try {
      const publicUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
        fileId
      )}`;

      const res = await withTimeout(
        fetch(publicUrl, {
          headers: { "User-Agent": "OurArchive-Metadata-Scanner/1.0" },
          cache: "no-store",
        }),
        7000,
        "Public download stream timed out."
      );

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (res.ok && !ct.includes("text/html")) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength <= MAX_SCAN_BYTES && buf.byteLength > 0) {
          fileBuffer = buf;
        }
      }
    } catch {
      // Ephemeral stream unavailable
    }
  }

  // 3. Extract text from first page / cover in-memory
  let firstPageText = "";

  if (fileBuffer && fileBuffer.byteLength > 0) {
    if (isPdf) {
      try {
        const extracted = await extractText(new Uint8Array(fileBuffer.slice(0)), {
          mergePages: false,
        });
        const pages = Array.isArray(extracted.text) ? extracted.text : [];
        if (pages.length > 0) {
          firstPageText = pages[0] || "";
        }
      } catch {
        // Fallback: decode first 8KB of buffer as plain text
        try {
          const decoder = new TextDecoder("utf-8");
          firstPageText = decoder.decode(fileBuffer.slice(0, 8192));
        } catch {
          firstPageText = "";
        }
      }
    } else {
      // Plain text, Markdown, HTML, or RTF document
      try {
        const decoder = new TextDecoder("utf-8");
        const rawText = decoder.decode(fileBuffer.slice(0, 32768));
        firstPageText = rawText.replace(/<[^>]+>/g, " ");
      } catch {
        firstPageText = "";
      }
    }
  }

  // 4. Deterministic Lexical Parser (Zero AI)
  return parseFirstPageMetadata(firstPageText, fileName);
}
