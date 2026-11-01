/**
 * Ephemeral HTML Sanitizer Utility using DOMPurify
 * Backlog Items: [OA-M2-F4]
 * Specifications: docs/architecture/reader_and_anti_bot_protection.md
 */

import DOMPurify from "isomorphic-dompurify";

export interface SanitizeOptions {
  stripStyles?: boolean;
}

/**
 * Sanitizes raw HTML retrieved from Google Docs export or reader streams.
 * Strips executable scripts, embeds, iframes, trackers, and unapproved attributes.
 */
export function sanitizeReaderHtml(rawHtml: string, options: SanitizeOptions = {}): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  const allowedTags = [
    "p",
    "span",
    "div",
    "b",
    "i",
    "strong",
    "em",
    "u",
    "s",
    "strike",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "br",
    "ul",
    "ol",
    "li",
    "table",
    "tbody",
    "tr",
    "td",
    "th",
    "thead",
  ];

  const allowedAttrs = ["class", "id"];

  // Optional: preserve inline style tags only if not stripping styles
  if (!options.stripStyles) {
    allowedAttrs.push("style");
  }

  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "form", "input", "button", "img"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "action", "href"],
    ALLOW_DATA_ATTR: false,
    RETURN_TRUSTED_TYPE: false,
  });
}
