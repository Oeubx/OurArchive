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
  resourcePath: string;   // e.g. "file/d/" or "drive/folders/"
  fileId: string;         // e.g. "1BxyZ9qK8LmN0OpQrStUvWxYz12345678"
  accessParams: string;   // e.g. "view?usp=sharing"
  canonicalUrl: string;
  defangedDisplay: string;
  isFolder?: boolean;
  errorMessage?: string;
}

const ALLOWED_DOMAINS = ["drive.google.com", "docs.google.com", "onedrive.live.com", "1drv.ms"];
const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{15,65}$/;

/**
 * Parses and cuts a Google Drive or OneDrive URL into safe, non-clickable segments.
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
      isFolder: false,
    };
  }

  try {
    // Basic protocol normalization
    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Domain Validation
    if (!ALLOWED_DOMAINS.includes(hostname)) {
      return {
        isValid: false,
        rawUrl: trimmed,
        protocolDomain: parsed.origin + "/",
        resourcePath: "",
        fileId: "",
        accessParams: "",
        canonicalUrl: "",
        defangedDisplay: `hxxps[://]${parsed.hostname}${parsed.pathname}`,
        isFolder: false,
        errorMessage: "Domain rejected. Only official Google Drive, Google Docs, or OneDrive links are permitted.",
      };
    }

    // Handle OneDrive
    if (hostname === "onedrive.live.com" || hostname === "1drv.ms") {
      const isFolder = trimmed.includes("resid=") || trimmed.includes("cid=") || trimmed.toLowerCase().includes("folder");
      return {
        isValid: true,
        rawUrl: trimmed,
        protocolDomain: `https://${parsed.hostname}/`,
        resourcePath: isFolder ? "folders/" : "view/",
        fileId: parsed.searchParams.get("resid") || parsed.pathname.slice(1, 25) || "shared_resource",
        accessParams: parsed.search ? parsed.search.replace(/^\?/, "") : "view",
        canonicalUrl: trimmed,
        defangedDisplay: `hxxps[://]${parsed.hostname}/${isFolder ? "folders/" : "view/"}...[verified]`,
        isFolder,
      };
    }

    // 2. Resource Path & File ID Extraction for Google Drive
    let resourcePath = "file/d/";
    let fileId = "";
    let isFolder = false;
    let accessParams = parsed.search ? parsed.search.replace(/^\?/, "") : "view?usp=sharing";

    // Format A: Google Drive folder (/drive/folders/{id} or /drive/u/0/folders/{id} or /folders/{id})
    const folderMatch = parsed.pathname.match(/\/(?:drive(?:\/u\/\d+)?\/folders|folders|folder\/d)\/([a-zA-Z0-9_-]+)/i);
    if (folderMatch) {
      resourcePath = "drive/folders/";
      fileId = folderMatch[1];
      isFolder = true;
    } else {
      // Format B: /file/d/{id} or /document/d/{id}
      const pathMatch = parsed.pathname.match(/\/(file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) {
        resourcePath = `${pathMatch[1]}/d/`;
        fileId = pathMatch[2];
      } else {
        // Format C: ?id={id}
        const idParam = parsed.searchParams.get("id");
        if (idParam) {
          resourcePath = "open?id=";
          fileId = idParam;
        } else {
          // Format D: /open?id= or /uc?id=
          const ucMatch = parsed.pathname.match(/\/(open|uc)/);
          if (ucMatch && parsed.searchParams.get("id")) {
            resourcePath = `${ucMatch[1]}?id=`;
            fileId = parsed.searchParams.get("id") || "";
          }
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
        isFolder,
        errorMessage: "Could not detect a valid Google Drive file or folder ID.",
      };
    }

    // 4. Construct canonical safe URL & defanged representation
    const canonicalUrl = isFolder
      ? `https://${parsed.hostname}/drive/folders/${fileId}`
      : `https://${parsed.hostname}/${resourcePath}${fileId}/${accessParams ? (accessParams.startsWith("view") ? accessParams : `view?${accessParams}`) : "view?usp=sharing"}`;
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
      isFolder,
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
      isFolder: false,
      errorMessage: "Invalid URL structure. Please enter a valid Google Drive or OneDrive link.",
    };
  }
}
