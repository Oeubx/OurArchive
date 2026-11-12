/**
 * Ephemeral HTML Sanitizer Utility (Native Serverless Implementation)
 * Backlog Items: [OA-M2-F4]
 * Specifications: docs/architecture/reader_and_anti_bot_protection.md
 * 
 * Zero-dependency, whitelist-based HTML sanitizer designed for serverless environments.
 * Eliminates JSDOM / @exodus/bytes ESM bundling issues (ERR_REQUIRE_ESM) while
 * strictly enforcing view-only zero-download fanwork presentation.
 */

export interface SanitizeOptions {
  stripStyles?: boolean;
}

const SAFE_TAGS = new Set([
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
]);

/**
 * Sanitizes raw HTML retrieved from Google Docs export or reader streams.
 * Strips executable scripts, embeds, iframes, trackers, and unapproved attributes.
 */
export function sanitizeReaderHtml(rawHtml: string, options: SanitizeOptions = {}): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  // If a full HTML document is passed from Google Docs export, isolate the <body> contents
  let content = rawHtml;
  const bodyMatch = rawHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    content = bodyMatch[1];
  }

  // 1. Strip dangerous tags and their enclosed content
  let clean = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  // 2. Strip void / self-closing dangerous elements
  clean = clean.replace(/<(meta|link|input|button|img|video|audio|source)\b[^>]*\/?>/gi, "");

  // 3. Strip all inline on* event attributes (e.g. onload, onerror, onclick)
  clean = clean.replace(/\s*on[a-zA-Z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  // 4. Strip dangerous pseudo-protocols in href/src
  clean = clean.replace(/\s*(href|src)\s*=\s*(['"])\s*(javascript|data):[^'"]*\2/gi, "");

  // 5. Whitelist allowed reading tags and filter tag attributes
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/g, (match, tag, attrs) => {
    const lower = tag.toLowerCase();
    if (!SAFE_TAGS.has(lower)) {
      return "";
    }

    // Closing tag
    if (match.startsWith("</")) {
      return `</${lower}>`;
    }

    // Opening tag: extract allowed attributes (class, id, style)
    const allowedAttrs: string[] = [];
    const attrRegex = /([a-zA-Z\-]+)\s*=\s*(['"])(.*?)\2/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const name = attrMatch[1].toLowerCase();
      const val = attrMatch[3];

      if (name === "class" || name === "id") {
        allowedAttrs.push(`${name}="${val}"`);
      } else if (name === "style" && !options.stripStyles) {
        // Disallow CSS expressions, external url(), or javascript execution in styles
        // Also strip typography and color overrides so reader font/size/theme controls work natively
        if (!/expression|javascript|url\s*\(/i.test(val)) {
          const cleanedDecl = val
            .split(";")
            .map((decl) => decl.trim())
            .filter((decl) => {
              if (!decl) return false;
              const prop = decl.split(":")[0]?.trim().toLowerCase();
              return !["font-family", "font-size", "color", "background-color", "background"].includes(prop);
            })
            .join("; ");
          if (cleanedDecl) {
            allowedAttrs.push(`style="${cleanedDecl}"`);
          }
        }
      }
    }

    return allowedAttrs.length > 0
      ? `<${lower} ${allowedAttrs.join(" ")}>`
      : `<${lower}>`;
  });

  return clean.trim();
}
