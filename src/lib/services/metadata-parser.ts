/**
 * Deterministic Fanwork First-Page Metadata Parser (Zero AI)
 * Backlog Items: [OA-M2-F2]
 * Specifications: docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md
 *
 * Runs purely on lexical tokenization and regular expressions.
 * No LLM calls, zero tokens, zero hallucinations.
 */

export interface ParsedWorkMetadata {
  title: string;
  canonicalSourceUrl?: string;
  rating?: string;
  warnings: string[];
  categories: string[];
  fandom: string;
  fandoms: string[];
  pairing?: string;
  relationships: string[];
  characters: string[];
  additionalTags: string[];
  language?: string;
  wordCount: number;
  chapters?: string;
  isComplete: boolean;
  publishedDate?: string;
  completedDate?: string;
  summary?: string;
  isNsfw: boolean;
  classification: "sfw" | "nsfw";
}

export interface ParseResult {
  success: boolean;
  isStandardCoverFormatted: boolean;
  message?: string;
  metadata: ParsedWorkMetadata;
}

const EXPLICIT_TAG_KEYWORDS = [
  "smut",
  "porn",
  "oral sex",
  "vaginal fingering",
  "penetration",
  "nsfw",
  "dead dove",
  "erotica",
  "anal sex",
  "explicit sexual content",
  "kink",
  "bdsm",
  "heavy petting",
];

const ADULT_WARNINGS = [
  "graphic depictions of violence",
  "rape/non-con",
  "underage",
  "rape",
  "non-consensual",
];

export function parseFirstPageMetadata(rawText: string, fallbackFileName?: string): ParseResult {
  const text = (rawText || "").trim();

  const defaultTitle = fallbackFileName
    ? fallbackFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim()
    : "Untitled Fanwork";

  const result: ParsedWorkMetadata = {
    title: defaultTitle,
    canonicalSourceUrl: undefined,
    rating: "Not Rated",
    warnings: [],
    categories: [],
    fandom: "",
    fandoms: [],
    pairing: undefined,
    relationships: [],
    characters: [],
    additionalTags: [],
    language: "English",
    wordCount: 0,
    chapters: undefined,
    isComplete: false,
    publishedDate: undefined,
    completedDate: undefined,
    summary: undefined,
    isNsfw: false,
    classification: "sfw",
  };

  if (!text) {
    return {
      success: true,
      isStandardCoverFormatted: false,
      message: "Empty document text. No cover metadata detected.",
      metadata: result,
    };
  }

  // 1. Detect Canonical Source URL and Title
  const sourceMatch = text.match(
    /(?:Posted originally (?:on|at)(?: the)?|Original source:?)\s*(?:Archive of Our Own at\s+)?(https?:\/\/[^\s]+)/i
  );

  if (sourceMatch) {
    result.canonicalSourceUrl = sourceMatch[1].replace(/[.,;:)]$/, "").trim();
    const beforeSource = text.substring(0, sourceMatch.index).trim();
    const lines = beforeSource.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      result.title = lines[lines.length - 1];
    }
  }

  // 2. Scan Standard Key-Value Fields
  const fieldPatterns = [
    "Rating",
    "Archive Warnings?",
    "Categor(?:y|ies)",
    "Fandoms?",
    "Relationships?",
    "Characters?",
    "Additional Tags",
    "Language",
    "Series",
    "Stats",
    "Summary",
  ];

  const fieldRegex = new RegExp(`(?:^|\\r?\\n)\\s*(${fieldPatterns.join("|")})\\s*:\\s*`, "gi");
  const matches = [...text.matchAll(fieldRegex)];

  let fieldsFound = 0;

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1].trim().toLowerCase();
    const startIndex = matches[i].index + matches[i][0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const rawVal = text.substring(startIndex, endIndex).replace(/\s+/g, " ").trim();

    if (!rawVal) continue;
    fieldsFound++;

    if (key.startsWith("rating")) {
      result.rating = rawVal;
    } else if (key.startsWith("archive warning")) {
      result.warnings = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("categor")) {
      result.categories = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("fandom")) {
      result.fandom = rawVal;
      result.fandoms = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("relationship")) {
      result.pairing = rawVal;
      result.relationships = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("character")) {
      result.characters = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("additional tag")) {
      result.additionalTags = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (key.startsWith("language")) {
      result.language = rawVal;
    } else if (key.startsWith("summary")) {
      result.summary = rawVal;
    } else if (key.startsWith("stats")) {
      const wordsMatch = rawVal.match(/Words:\s*([0-9,]+)/i);
      if (wordsMatch) {
        result.wordCount = parseInt(wordsMatch[1].replace(/,/g, ""), 10);
      }
      const chaptersMatch = rawVal.match(/Chapters:\s*(\d+)\s*\/\s*(\d+|\?)/i);
      if (chaptersMatch) {
        result.chapters = `${chaptersMatch[1]}/${chaptersMatch[2]}`;
        result.isComplete = chaptersMatch[2] !== "?" && chaptersMatch[1] === chaptersMatch[2];
      }
      const pubMatch = rawVal.match(/Published:\s*([0-9-]+)/i);
      if (pubMatch) result.publishedDate = pubMatch[1];
      const compMatch = rawVal.match(/(?:Completed|Updated):\s*([0-9-]+)/i);
      if (compMatch) result.completedDate = compMatch[1];
    }
  }

  // 3. Fallback: If no stats wordCount was found, estimate words from text length
  if (!result.wordCount) {
    const rawWordCount = text.split(/\s+/).filter(Boolean).length;
    result.wordCount = rawWordCount;
  }

  // 4. Fallback Title: If not detected by source URL pattern, check first non-empty line
  if (result.title === defaultTitle && matches.length > 0) {
    const firstMatchIndex = matches[0].index;
    const preText = text.substring(0, firstMatchIndex).trim();
    const preLines = preText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (preLines.length > 0 && preLines[0].length < 120) {
      result.title = preLines[0];
    }
  }

  // 5. Deterministic SFW vs NSFW Classification
  const normalizedRating = (result.rating || "").toLowerCase();
  const isAdultRating = normalizedRating === "explicit" || normalizedRating === "mature";

  const hasAdultWarning = result.warnings.some((w) =>
    ADULT_WARNINGS.some((kw) => w.toLowerCase().includes(kw))
  );

  const hasExplicitTag = result.additionalTags.some((tag) =>
    EXPLICIT_TAG_KEYWORDS.some((kw) => tag.toLowerCase().includes(kw))
  );

  if (isAdultRating || hasAdultWarning || hasExplicitTag) {
    result.isNsfw = true;
    result.classification = "nsfw";
  } else {
    result.isNsfw = false;
    result.classification = "sfw";
  }

  const isStandardCover = fieldsFound >= 2 || Boolean(sourceMatch);

  return {
    success: true,
    isStandardCoverFormatted: isStandardCover,
    message: isStandardCover
      ? "Standard fanwork cover metadata extracted successfully."
      : "Plain document detected. No standard cover metadata headers found.",
    metadata: result,
  };
}
