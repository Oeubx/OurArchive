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

    // Handling Folder Submissions: folders cannot be streamed in the single-document reader
    const isFolder =
      mimeType.toLowerCase().includes("folder") ||
      mimeType === "application/vnd.google-apps.folder" ||
      (typeof link.drive_url === "string" && link.drive_url.includes("/folders/"));

    if (isFolder) {
      return NextResponse.json(
        {
          error:
            "This item is a folder collection. The emergency reader is designed for individual fanfiction documents and PDF files.",
        },
        { status: 422 }
      );
    }

    // Handling PDF Documents: Stream via isolated view-only preview frame
    if (mimeType.toLowerCase().includes("pdf")) {
      return NextResponse.json({
        success: true,
        workId: link.id,
        title: metadata?.title || "Untitled Fanwork",
        authorName: metadata?.author_name || "Unknown Author",
        fandom: metadata?.fandom || "General",
        pairing: metadata?.pairing || null,
        rating: metadata?.rating || "Not Rated",
        wordCount: metadata?.word_count ?? 0,
        summary: metadata?.summary || null,
        tags: metadata?.tags || [],
        isPdf: true,
        pdfPreviewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        contentHtml: null,
      });
    }

    // Handling Google Docs / Text Documents: Ephemeral HTML Export & DOMPurify Sanitization
    let rawHtml = "";

    // 1. Attempt official Drive v3 REST API export if API key is present
    if (apiKey) {
      try {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId
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
          fileId
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

    // 3. Clean raw HTML stream with DOMPurify: strip scripts, iframes, trackers
    const sanitizedHtml = sanitizeReaderHtml(rawHtml);

    return NextResponse.json({
      success: true,
      workId: link.id,
      title: metadata?.title || "Untitled Fanwork",
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
