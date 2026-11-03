/**
 * URL Defanger & Segmenter for Google Drive Links
 *
 * Slices raw URLs into distinct non-executable chunks to prevent
 * accidental clicks, browser prefetching, and homoglyph spoofing.
 */

export interface SegmentedDriveUrl {
  isValid: boolean;
  rawUrl: string;
  protocolDomain: string; // e.g. "https://drive.google.com/"
  resourcePath: string;   // e.g. "file/d/" or "document/d/"
  fileId: string;         // e.g. "1BxyZ9qK8LmN0OpQrStUvWxYz12345678"
  accessParams: string;   // e.g. "view?usp=sharing"
  canonicalUrl: string;
  defangedDisplay: string;
  errorMessage?: string;
}

const ALLOWED_DOMAINS = ["drive.google.com", "docs.google.com"];
const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{20,55}$/;

/**
 * Parses and cuts a Google Drive URL into safe, non-clickable segments.
 */
export function segmentDriveUrl(inputUrl: string): SegmentedDriveUrl {
  const trimmed = inputUrl.trim();

  if (!trimmed) {
    return {
      isValid: false,
      rawUrl: "",
      protocolDomain: "https://drive.google.com/",
      resourcePath: "file/d/",
      fileId: "",
      accessParams: "view?usp=sharing",
      canonicalUrl: "",
      defangedDisplay: "",
    };
  }

  try {
    // Basic protocol normalization
    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(normalized);

    // 1. Domain Validation (Blocks punycode, homoglyphs, and unauthorized domains)
    if (!ALLOWED_DOMAINS.includes(parsed.hostname.toLowerCase())) {
      return {
        isValid: false,
        rawUrl: trimmed,
        protocolDomain: parsed.origin + "/",
        resourcePath: "",
        fileId: "",
        accessParams: "",
        canonicalUrl: "",
        defangedDisplay: `hxxps[://]${parsed.hostname}${parsed.pathname}`,
        errorMessage: "Domain rejected. Only official drive.google.com or docs.google.com links are permitted.",
      };
    }

    // 2. Resource Path & File ID Extraction
    let resourcePath = "file/d/";
    let fileId = "";
    let accessParams = parsed.search ? parsed.search.replace(/^\?/, "") : "view?usp=sharing";

    // Format 1: /file/d/{id} or /document/d/{id}
    const pathMatch = parsed.pathname.match(/\/(file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      resourcePath = `${pathMatch[1]}/d/`;
      fileId = pathMatch[2];
    } else {
      // Format 2: ?id={id}
      const idParam = parsed.searchParams.get("id");
      if (idParam) {
        resourcePath = "open?id=";
        fileId = idParam;
      } else {
        // Format 3: /open?id= or /uc?id=
        const ucMatch = parsed.pathname.match(/\/(open|uc)/);
        if (ucMatch && parsed.searchParams.get("id")) {
          resourcePath = `${ucMatch[1]}?id=`;
          fileId = parsed.searchParams.get("id") || "";
        }
      }
    }

    // 3. File ID Regex Verification
    if (!fileId || !FILE_ID_REGEX.test(fileId)) {
      return {
        isValid: false,
        rawUrl: trimmed,
        protocolDomain: `${parsed.protocol}//${parsed.hostname}/`,
        resourcePath,
        fileId: fileId || "(missing)",
        accessParams,
        canonicalUrl: "",
        defangedDisplay: `hxxps[://]${parsed.hostname}/${resourcePath}[INVALID_ID]`,
        errorMessage: "Could not detect a valid Google Drive file ID (20-55 alphanumeric characters).",
      };
    }

    // 4. Construct canonical safe URL & defanged representation
    const canonicalUrl = `https://${parsed.hostname}/${resourcePath}${fileId}/${accessParams ? (accessParams.startsWith("view") ? accessParams : `view?${accessParams}`) : "view?usp=sharing"}`;
    const defangedDisplay = `hxxps[://]${parsed.hostname}/${resourcePath}${fileId.slice(0, 4)}...[omitted]`;

    return {
      isValid: true,
      rawUrl: trimmed,
      protocolDomain: `https://${parsed.hostname}/`,
      resourcePath,
      fileId,
      accessParams: accessParams.startsWith("view") ? accessParams : `view?${accessParams}`,
      canonicalUrl,
      defangedDisplay,
    };
  } catch {
    return {
      isValid: false,
      rawUrl: trimmed,
      protocolDomain: "https://drive.google.com/",
      resourcePath: "file/d/",
      fileId: "",
      accessParams: "view?usp=sharing",
      canonicalUrl: "",
      defangedDisplay: "INVALID_URL",
      errorMessage: "Invalid URL structure. Please enter a valid Google Drive link.",
    };
  }
}
