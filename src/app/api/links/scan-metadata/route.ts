/**
 * In-Memory Ephemeral Metadata Scanner Endpoint
 * Backlog Items: [OA-M2-F2]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *
 * Reads only the first page / cover in-memory without saving to disk.
 * Strictly adheres to the Read-Only / Zero-Download and Zero-AI Architecture.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateAndNormalizeDriveUrl } from "@/lib/services/drive-validator";
import { fetchDriveFileMetadata, fetchDriveFolderChildren } from "@/lib/services/drive-api";
import { extractFileMetadataFromDrive } from "@/lib/services/metadata-extractor";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

    // 1. Handle Folder Collections: Traverse children & sample-scan metadata
    if (validation.isFolder) {
      let folderChildren: Array<{ id: string; name: string; mimeType: string; sizeBytes: number; cleanTitle: string }> = [];
      let detectedFolderName = "Curated Folder Collection";

      if (apiKey) {
        const folderResult = await fetchDriveFolderChildren(fileId, 4, 30);
        if (folderResult.success) {
          if (folderResult.folderName) {
            detectedFolderName = folderResult.folderName;
          }
          if (folderResult.children && folderResult.children.length > 0) {
            folderChildren = folderResult.children;
          }
        }
      }

      if (folderChildren.length > 0) {
        // Sample-scan up to 6 child documents in parallel to aggregate collection metadata
        const samples = folderChildren.slice(0, 6);
        const childScans = await Promise.all(
          samples.map((c) => extractFileMetadataFromDrive(c.id, c.name, c.mimeType, apiKey))
        );

        const fandomCounts: Record<string, number> = {};
        const authorCounts: Record<string, number> = {};
        const categoriesSet = new Set<string>();
        const warningsSet = new Set<string>();
        const charactersSet = new Set<string>();
        const tagsSet = new Set<string>(["Collection Folder"]);
        let maxRating = "General Audiences";
        let isAnyNsfw = false;
        let totalSampleWords = 0;

        const ratingPriority = ["General Audiences", "Teen And Up Audiences", "Mature", "Explicit"];

        for (const scan of childScans) {
          const m = scan.metadata;
          if (m.fandom) {
            fandomCounts[m.fandom] = (fandomCounts[m.fandom] || 0) + 1;
          }
          if (m.author) {
            authorCounts[m.author] = (authorCounts[m.author] || 0) + 1;
          }
          m.categories.forEach((cat) => categoriesSet.add(cat));
          m.warnings.forEach((warn) => warningsSet.add(warn));
          m.characters.forEach((char) => charactersSet.add(char));
          m.additionalTags.forEach((t) => tagsSet.add(t));
          if (m.wordCount) totalSampleWords += m.wordCount;
          if (m.isNsfw) isAnyNsfw = true;

          if (m.rating && ratingPriority.indexOf(m.rating) > ratingPriority.indexOf(maxRating)) {
            maxRating = m.rating;
          }
        }

        const dominantFandom = Object.entries(fandomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        const dominantAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

        return NextResponse.json({
          success: true,
          isStandardCoverFormatted: true,
          totalChildrenFound: folderChildren.length,
          message: `✨ Folder collection scanned (${folderChildren.length} works found). Aggregate metadata auto-filled from member works!`,
          metadata: {
            title: detectedFolderName,
            author: dominantAuthor || undefined,
            rating: maxRating,
            warnings: Array.from(warningsSet),
            categories: Array.from(categoriesSet),
            fandom: dominantFandom,
            fandoms: Object.keys(fandomCounts),
            pairing: undefined,
            relationships: [],
            characters: Array.from(charactersSet).slice(0, 10),
            additionalTags: Array.from(tagsSet).slice(0, 15),
            language: "English",
            wordCount: totalSampleWords,
            isComplete: false,
            isNsfw: isAnyNsfw,
            classification: isAnyNsfw ? "nsfw" : "sfw",
          },
        });
      }

      // Fallback if empty folder or children could not be queried
      return NextResponse.json({
        success: true,
        isStandardCoverFormatted: false,
        totalChildrenFound: 0,
        message: "Folder collection detected. Child works will be indexed upon submission.",
        metadata: {
          title: detectedFolderName,
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

    // 2. Handle Individual Fanwork Files
    let fileName = "Shared Fanwork";
    let mimeType = "application/pdf";

    if (apiKey) {
      const driveMetaResult = await fetchDriveFileMetadata(fileId);
      if (driveMetaResult.success && driveMetaResult.metadata) {
        fileName = driveMetaResult.metadata.name;
        mimeType = driveMetaResult.metadata.mimeType;
      }
    }

    const parseResult = await extractFileMetadataFromDrive(fileId, fileName, mimeType, apiKey);

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
