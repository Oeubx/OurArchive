/**
 * Ephemeral Reader Content Streaming API Endpoint
 * Backlog Items: [OA-M2-F4]
 * Specifications: docs/architecture/reader_and_anti_bot_protection.md
 *                 docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeReaderHtml } from "@/lib/utils/sanitize-html";
import { withTimeout } from "@/lib/utils/with-timeout";
import { unmaskWorkId } from "@/lib/utils/idMasker";
import { fetchDriveFolderChildren } from "@/lib/services/drive-api";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

interface RouteParams {
  params: {
    id: string;
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rawId = params.id;
    if (!rawId) {
      return NextResponse.json({ error: "Work ID is required." }, { status: 400 });
    }

    const workId = unmaskWorkId(rawId);

    if (!UUID_REGEX.test(workId)) {
      return NextResponse.json({ error: "Invalid Work ID format." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: link, error } = await supabase
      .from("drive_links")
      .select(`
        id,
        drive_url,
        google_file_id,
        upload_mode,
        verification_status,
        is_hidden,
        is_removed,
        link_metadata (
          title,
          author_name,
          fandom,
          pairing,
          rating,
          word_count,
          summary,
          tags,
          mime_type,
          file_name
        )
      `)
      .eq("id", workId)
      .eq("is_removed", false)
      .maybeSingle();

    if (error || !link) {
      return NextResponse.json(
        { error: "Work not found or has been removed." },
        { status: 404 }
      );
    }

    if (link.is_hidden) {
      return NextResponse.json(
        { error: "This work is hidden from public viewing." },
        { status: 403 }
      );
    }

    const metadata = Array.isArray(link.link_metadata)
      ? link.link_metadata[0]
      : link.link_metadata;

    const fileId = link.google_file_id;
    const mimeType = metadata?.mime_type || "application/octet-stream";
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

    // Check if target is a Folder Collection
    const isFolder =
      mimeType.toLowerCase().includes("folder") ||
      mimeType === "application/vnd.google-apps.folder" ||
      (typeof link.drive_url === "string" && link.drive_url.includes("/folders/"));

    // Check if client requested a specific child document inside a collection
    const childIdParam = request.nextUrl.searchParams.get("childId");
    const childTitleParam = request.nextUrl.searchParams.get("childTitle");
    const childMimeParam = request.nextUrl.searchParams.get("mimeType");

    // Solution A: If a folder is requested without a specific childId, return the Collection Table of Contents
    if (isFolder && !childIdParam) {
      // 1. Check for child works in database matching this collection
      const collectionWorks: Array<{
        id: string;
        title: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
      }> = [];

      try {
        const { data: dbChildren } = await supabase
          .from("drive_links")
          .select(`
            id,
            google_file_id,
            drive_url,
            link_metadata (
              title,
              file_name,
              mime_type,
              file_size_bytes,
              canonical_source_url
            )
          `)
          .neq("id", workId)
          .eq("is_removed", false);

        if (dbChildren && dbChildren.length > 0) {
          dbChildren.forEach((item) => {
            const meta = Array.isArray(item.link_metadata)
              ? item.link_metadata[0]
              : item.link_metadata;
            if (meta?.canonical_source_url === link.drive_url) {
              collectionWorks.push({
                id: item.google_file_id || item.id,
                title: meta.title,
                fileName: meta.file_name,
                mimeType: meta.mime_type,
                sizeBytes: Number(meta.file_size_bytes) || 0,
              });
            }
          });
        }
      } catch (dbErr) {
        console.warn("Could not query unpacked collection works from DB:", dbErr);
      }

      // 2. Query Drive API directly for live folder contents (including recursive nested subfolders)
      if (apiKey && collectionWorks.length === 0) {
        const folderResult = await fetchDriveFolderChildren(fileId);
        if (folderResult.success && folderResult.children && folderResult.children.length > 0) {
          folderResult.children.forEach((c) => {
            collectionWorks.push({
              id: c.id,
              title: c.cleanTitle,
              fileName: c.name,
              mimeType: c.mimeType,
              sizeBytes: c.sizeBytes,
            });
          });
        }
      }

      return NextResponse.json({
        success: true,
        isFolder: true,
        workId: link.id,
        title: metadata?.title || "Curated Fanwork Collection",
        authorName: metadata?.author_name || "Community Backup",
        fandom: metadata?.fandom || "General Fanworks",
        pairing: metadata?.pairing || null,
        rating: metadata?.rating || "General Audiences",
        wordCount: metadata?.word_count ?? 0,
        summary:
          metadata?.summary ||
          "Shared Google Drive folder collection containing multiple fanworks. Select any work below to read.",
        tags: metadata?.tags || [],
        collectionWorks,
      });
    }

    // Resolve active streaming target (defaults to primary file, or child work if selected)
    let activeFileId = fileId;
    let activeMimeType = (childMimeParam || mimeType).toLowerCase();
    let activeTitle = childTitleParam || metadata?.title || "Untitled Fanwork";

    if (childIdParam) {
      // Check if childIdParam was passed as an internal database UUID or masked oa_ token
      const unmaskedChild = unmaskWorkId(childIdParam);
      if (UUID_REGEX.test(unmaskedChild)) {
        const { data: childRecord } = await supabase
          .from("drive_links")
          .select(`
            google_file_id,
            link_metadata (
              title,
              mime_type
            )
          `)
          .eq("id", unmaskedChild)
          .maybeSingle();

        if (childRecord && childRecord.google_file_id) {
          activeFileId = childRecord.google_file_id;
          const childMeta = Array.isArray(childRecord.link_metadata)
            ? childRecord.link_metadata[0]
            : childRecord.link_metadata;
          if (childMeta?.mime_type) activeMimeType = childMeta.mime_type.toLowerCase();
          if (childMeta?.title) activeTitle = childMeta.title;
        } else {
          activeFileId = childIdParam;
        }
      } else {
        // It's already an authentic Google Drive File ID
        activeFileId = childIdParam;
      }
    }

    // Handling PDF Documents: Stream via isolated view-only preview frame
    if (activeMimeType.includes("pdf")) {
      return NextResponse.json({
        success: true,
        workId: link.id,
        title: activeTitle,
        authorName: metadata?.author_name || "Unknown Author",
        fandom: metadata?.fandom || "General",
        pairing: metadata?.pairing || null,
        rating: metadata?.rating || "Not Rated",
        wordCount: metadata?.word_count ?? 0,
        summary: metadata?.summary || null,
        tags: metadata?.tags || [],
        isPdf: true,
        pdfPreviewUrl: `https://drive.google.com/file/d/${activeFileId}/preview`,
        contentHtml: null,
      });
    }

    // Handling Google Docs / Text Documents: Ephemeral HTML Export & DOMPurify Sanitization
    let rawHtml = "";

    // 1. Attempt official Drive v3 REST API export if API key is present
    if (apiKey) {
      try {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          activeFileId
        )}/export?mimeType=text/html&key=${apiKey}`;

        const apiResponse = await withTimeout(
          fetch(exportUrl, {
            headers: { Accept: "text/html" },
            cache: "no-store",
          }),
          3500,
          "Drive export request timed out."
        );

        if (apiResponse.ok) {
          rawHtml = await apiResponse.text();
        }
      } catch {
        // Fallback to public feed export
      }
    }

    // 2. Fallback to public export endpoint if API key failed or is not available
    if (!rawHtml) {
      try {
        const publicExportUrl = `https://docs.google.com/feeds/download/documents/export/Export?id=${encodeURIComponent(
          activeFileId
        )}&exportFormat=html`;

        const feedResponse = await withTimeout(
          fetch(publicExportUrl, {
            headers: { "User-Agent": "OurArchive-Emergency-Reader/1.0" },
            cache: "no-store",
          }),
          3500,
          "Public doc export request timed out."
        );

        if (feedResponse.ok) {
          rawHtml = await feedResponse.text();
        }
      } catch {
        // Ignored
      }
    }

    if (!rawHtml) {
      return NextResponse.json(
        {
          error:
            "Could not fetch document content. Ensure the Google Drive file permissions are set to 'Anyone with the link can view'.",
        },
        { status: 502 }
      );
    }

    // 3. Clean raw HTML stream with zero-dependency native sanitizer
    const sanitizedHtml = sanitizeReaderHtml(rawHtml);

    return NextResponse.json({
      success: true,
      workId: link.id,
      title: activeTitle,
      authorName: metadata?.author_name || "Unknown Author",
      fandom: metadata?.fandom || "General",
      pairing: metadata?.pairing || null,
      rating: metadata?.rating || "Not Rated",
      wordCount: metadata?.word_count ?? 0,
      summary: metadata?.summary || null,
      tags: metadata?.tags || [],
      isPdf: false,
      contentHtml: sanitizedHtml,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
