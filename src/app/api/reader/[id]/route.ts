/**
 * Ephemeral Reader Content Streaming API Endpoint
 * Backlog Items: [OA-M2-F4]
 * Specifications: docs/architecture/reader_and_anti_bot_protection.md
 *                 docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractText, extractTextItems, type StructuredTextItem } from "unpdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeReaderHtml } from "@/lib/utils/sanitize-html";
import { withTimeout } from "@/lib/utils/with-timeout";
import { unmaskWorkId } from "@/lib/utils/idMasker";
import { fetchDriveFolderChildren } from "@/lib/services/drive-api";

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNativePdfHtml(pages: string[]): string {
  const totalPages = pages.length;
  return pages
    .map((pageText, index) => {
      const pageNumber = index + 1;
      const trimmed = pageText.trim();
      if (!trimmed) return "";

      const paragraphs = trimmed
        .split(/\n{2,}|\r\n\r\n/)
        .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
        .filter(Boolean)
        .map((block) => `<p>${escapeHtmlText(block)}</p>`)
        .join("");

      if (!paragraphs) return "";

      return `<div data-pdf-page="${pageNumber}" class="mb-6"><div class="text-xs opacity-60 border-b pb-1 mb-3">Page ${pageNumber} of ${totalPages}</div>${paragraphs}</div>`;
    })
    .filter(Boolean)
    .join("");
}

interface VisualLine {
  y: number;
  leftX: number;
  rightX: number;
  fontSize: number;
  text: string;
}

function isSceneOrHeaderLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^[_*\-=~]{3,}$/.test(trimmed) ||
    /^\*{2,}.*\*{2,}$/.test(trimmed) ||
    /^(Title|Summary|Status|Author|Fandom|Pairing|Rating|Warnings?|Chapter)\s*:/i.test(trimmed)
  );
}

function buildFormattedPdfHtml(pageItems: StructuredTextItem[][]): string {
  const totalPages = pageItems.length;

  return pageItems
    .map((rawItems, index) => {
      const pageNumber = index + 1;
      const items = rawItems.filter((item) => item.str && item.str.trim().length > 0);
      if (items.length === 0) return "";

      // 1. Cluster spans into visual lines by baseline Y coordinate
      const lineBuckets: Array<{ y: number; items: StructuredTextItem[] }> = [];
      for (const item of items) {
        const tol = Math.max(2, (item.fontSize || 12) * 0.35);
        const existing = lineBuckets.find((b) => Math.abs(b.y - item.y) <= tol);
        if (existing) {
          existing.items.push(item);
        } else {
          lineBuckets.push({ y: item.y, items: [item] });
        }
      }

      // Sort lines top-to-bottom (PDF origin y=0 is bottom-left)
      lineBuckets.sort((a, b) => b.y - a.y);

      const lines: VisualLine[] = lineBuckets
        .map((bucket) => {
          bucket.items.sort((a, b) => a.x - b.x);
          let lineText = "";
          let prevEnd = 0;
          let prevFontSize = 12;

          for (let i = 0; i < bucket.items.length; i++) {
            const span = bucket.items[i];
            const fontSize = span.fontSize || 12;
            const part = span.str;
            if (i === 0) {
              lineText = part;
            } else {
              const gap = span.x - prevEnd;
              const needsSpace =
                gap > Math.max(1.5, prevFontSize * 0.18) &&
                !lineText.endsWith(" ") &&
                !part.startsWith(" ");
              lineText += (needsSpace ? " " : "") + part;
            }
            prevEnd = span.x + (span.width || 0);
            prevFontSize = fontSize;
          }

          const first = bucket.items[0];
          const last = bucket.items[bucket.items.length - 1];
          const avgFont =
            bucket.items.reduce((acc, s) => acc + (s.fontSize || 12), 0) / bucket.items.length;

          return {
            y: bucket.y,
            leftX: first.x,
            rightX: last.x + (last.width || 0),
            fontSize: avgFont,
            text: lineText.trim(),
          };
        })
        .filter((line) => line.text.length > 0);

      if (lines.length === 0) return "";

      // 2. Estimate normal line spacing (median vertical delta within typical range)
      const typicalFont =
        lines.reduce((acc, l) => acc + l.fontSize, 0) / lines.length || 12;
      const normalGaps: number[] = [];
      for (let i = 1; i < lines.length; i++) {
        const dy = lines[i - 1].y - lines[i].y;
        if (dy >= typicalFont * 0.8 && dy <= typicalFont * 2.5) {
          normalGaps.push(dy);
        }
      }
      normalGaps.sort((a, b) => a - b);
      const medianGap =
        normalGaps.length > 0
          ? normalGaps[Math.floor(normalGaps.length / 2)]
          : typicalFont * 1.35;

      const pageMaxRight = Math.max(...lines.map((l) => l.rightX), 1);

      // 3. Reconstruct paragraphs preserving blank-line spacing and intentional short breaks
      const blocks: Array<{ text: string; extraSpace: boolean }> = [];
      let currentLines: string[] = [lines[0].text];
      let currentExtraSpace = false;

      for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1];
        const curr = lines[i];
        const dy = prev.y - curr.y;

        const hasBlankLineGap = dy > medianGap * 1.45;
        const hasLargeGap = dy > medianGap * 2.2;
        const isMarkerBreak =
          isSceneOrHeaderLine(prev.text) || isSceneOrHeaderLine(curr.text);
        const isShortIntentionalBreak =
          prev.rightX < pageMaxRight * 0.72 &&
          /[.!?:;"'”’)\]]$/.test(prev.text);

        if (hasBlankLineGap || isMarkerBreak || isShortIntentionalBreak) {
          blocks.push({ text: currentLines.join(" "), extraSpace: currentExtraSpace });
          currentLines = [curr.text];
          currentExtraSpace = hasLargeGap;
        } else {
          currentLines.push(curr.text);
        }
      }

      if (currentLines.length > 0) {
        blocks.push({ text: currentLines.join(" "), extraSpace: currentExtraSpace });
      }

      const paragraphsHtml = blocks
        .map((b) => {
          const marginClass = b.extraSpace ? ' class="mt-6"' : "";
          return `<p${marginClass}>${escapeHtmlText(b.text)}</p>`;
        })
        .join("");

      return `<div data-pdf-page="${pageNumber}" class="mb-6"><div class="text-xs opacity-60 border-b pb-1 mb-3">Page ${pageNumber} of ${totalPages}</div>${paragraphsHtml}</div>`;
    })
    .filter(Boolean)
    .join("");
}

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

    // Handling PDF Documents: Ephemeral In-Memory Text Extraction (Zero-Download) with Preview Fallback
    if (activeMimeType.includes("pdf")) {
      let pdfBytes: ArrayBuffer | null = null;
      const maxPdfBytes = 15 * 1024 * 1024; // 15 MB in-memory safety cap

      if (apiKey) {
        try {
          const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            activeFileId
          )}?alt=media&key=${apiKey}`;
          const mediaRes = await withTimeout(
            fetch(mediaUrl, { cache: "no-store" }),
            6000,
            "Drive PDF stream timed out."
          );
          if (mediaRes.ok) {
            const contentLength = Number(mediaRes.headers.get("content-length") || "0");
            if (!contentLength || contentLength <= maxPdfBytes) {
              const buf = await mediaRes.arrayBuffer();
              if (buf.byteLength <= maxPdfBytes) {
                pdfBytes = buf;
              }
            }
          }
        } catch {
          // Fall back to public download endpoint
        }
      }

      if (!pdfBytes) {
        try {
          const publicPdfUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
            activeFileId
          )}`;
          const publicRes = await withTimeout(
            fetch(publicPdfUrl, {
              headers: { "User-Agent": "OurArchive-Emergency-Reader/1.0" },
              cache: "no-store",
            }),
            6000,
            "Public PDF stream timed out."
          );
          const contentType = (publicRes.headers.get("content-type") || "").toLowerCase();
          if (publicRes.ok && !contentType.includes("text/html")) {
            const contentLength = Number(publicRes.headers.get("content-length") || "0");
            if (!contentLength || contentLength <= maxPdfBytes) {
              const buf = await publicRes.arrayBuffer();
              if (buf.byteLength <= maxPdfBytes) {
                pdfBytes = buf;
              }
            }
          }
        } catch {
          // Ignored; fall back to iframe preview
        }
      }

      const drivePreviewUrl = `https://drive.google.com/file/d/${activeFileId}/preview`;

      if (pdfBytes) {
        try {
          const [structured, extracted] = await Promise.all([
            extractTextItems(new Uint8Array(pdfBytes.slice(0))),
            extractText(new Uint8Array(pdfBytes.slice(0)), {
              mergePages: false,
            }),
          ]);

          const pages = Array.isArray(extracted.text) ? extracted.text : [];
          const hasSelectableText = pages.some((p) => p.trim().length > 0);

          if (hasSelectableText) {
            const plainRawHtml = buildNativePdfHtml(pages);
            const plainSanitizedHtml = sanitizeReaderHtml(plainRawHtml);

            const formattedRawHtml = Array.isArray(structured.items)
              ? buildFormattedPdfHtml(structured.items)
              : "";
            const formattedSanitizedHtml = formattedRawHtml
              ? sanitizeReaderHtml(formattedRawHtml)
              : plainSanitizedHtml;

            if (formattedSanitizedHtml || plainSanitizedHtml) {
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
                isNativePdf: true,
                totalPages: structured.totalPages || extracted.totalPages || pages.length,
                pdfPreviewUrl: drivePreviewUrl,
                drivePreviewUrl,
                contentHtml: formattedSanitizedHtml || plainSanitizedHtml,
                plainContentHtml: plainSanitizedHtml || formattedSanitizedHtml,
              });
            }
          }
        } catch (pdfErr) {
          console.warn("Ephemeral PDF text extraction failed, falling back to iframe:", pdfErr);
        }
      }

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
        isNativePdf: false,
        pdfPreviewUrl: drivePreviewUrl,
        drivePreviewUrl,
        contentHtml: null,
        plainContentHtml: null,
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
      drivePreviewUrl: `https://drive.google.com/file/d/${activeFileId}/preview`,
      contentHtml: sanitizedHtml,
      plainContentHtml: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
