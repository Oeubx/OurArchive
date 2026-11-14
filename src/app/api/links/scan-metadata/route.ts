/**
 * In-Memory Ephemeral Metadata Scanner Endpoint
 * Backlog Items: [OA-M2-F2]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *
 * Reads only the first page / cover in-memory without saving to disk.
 * Zero AI / Zero LLM / Zero local storage.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractText } from "unpdf";
import { validateAndNormalizeDriveUrl } from "@/lib/services/drive-validator";
import { fetchDriveFileMetadata } from "@/lib/services/drive-api";
import { parseFirstPageMetadata } from "@/lib/services/metadata-parser";
import { withTimeout } from "@/lib/utils/with-timeout";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { driveUrl } = body;

    if (!driveUrl || typeof driveUrl !== "string") {
      return NextResponse.json(
        { error: "A valid Google Drive or cloud drive URL is required." },
        { status: 400 }
      );
    }

    const validation = validateAndNormalizeDriveUrl(driveUrl);
    if (!validation.isValid || !validation.fileId) {
      return NextResponse.json(
        { error: validation.error || "Invalid Google Drive link format." },
        { status: 400 }
      );
    }

    const fileId = validation.fileId;
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

    // 1. Fetch file descriptors
    let fileName = validation.isFolder ? "Folder Collection" : "Shared Fanwork";
    let mimeType = validation.isFolder
      ? "application/vnd.google-apps.folder"
      : "application/pdf";

    if (apiKey && !validation.isFolder) {
      const driveMetaResult = await fetchDriveFileMetadata(fileId);
      if (driveMetaResult.success && driveMetaResult.metadata) {
        fileName = driveMetaResult.metadata.name;
        mimeType = driveMetaResult.metadata.mimeType;
      }
    }

    // If folder, return early with folder title
    if (validation.isFolder) {
      return NextResponse.json({
        success: true,
        isStandardCoverFormatted: false,
        message: "Folder collection detected. Child works will be indexed upon submission.",
        metadata: {
          title: fileName,
          rating: "Not Rated",
          warnings: [],
          categories: [],
          fandom: "",
          fandoms: [],
          pairing: undefined,
          relationships: [],
          characters: [],
          additionalTags: ["Collection Folder"],
          language: "English",
          wordCount: 0,
          isComplete: false,
          isNsfw: false,
          classification: "sfw",
        },
      });
    }

    let firstPageText = "";
    const maxScanBytes = 8 * 1024 * 1024; // 8 MB safety cap for cover stream

    // 2. Fetch Ephemeral Stream Buffer
    let fileBuffer: ArrayBuffer | null = null;

    if (apiKey) {
      try {
        const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
        )}?alt=media&key=${apiKey}`;
        const res = await withTimeout(
          fetch(mediaUrl, { cache: "no-store" }),
          6000,
          "Drive stream timed out."
        );
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength <= maxScanBytes) {
            fileBuffer = buf;
          }
        }
      } catch {
        // Fallback to public export
      }
    }

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
          6000,
          "Public download stream timed out."
        );
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (res.ok && !ct.includes("text/html")) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength <= maxScanBytes) {
            fileBuffer = buf;
          }
        }
      } catch {
        // Ignored
      }
    }

    // 3. Extract text from first page / cover
    if (fileBuffer) {
      const isPdf =
        mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

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
          // Plain text fallback
        }
      } else {
        // Plain text / HTML document
        const decoder = new TextDecoder("utf-8");
        const rawText = decoder.decode(fileBuffer.slice(0, 32768));
        firstPageText = rawText.replace(/<[^>]+>/g, " ");
      }
    }

    // 4. Deterministic Parse
    const parseResult = parseFirstPageMetadata(firstPageText, fileName);

    return NextResponse.json({
      success: true,
      isStandardCoverFormatted: parseResult.isStandardCoverFormatted,
      message: parseResult.message,
      metadata: parseResult.metadata,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to scan fanwork metadata.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
