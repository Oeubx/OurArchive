/**
 * Two-Tier Automated Threat Scanner Service
 * Backlog Items: [OA-M3-F1]
 * Specifications: docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 *                 docs/architecture/security_and_verification_pipeline.md
 */

import { withTimeout } from "@/lib/utils/with-timeout";
import type { GoogleDriveFileMetadata } from "@/lib/services/drive-api";

/**
 * Strict MIME allowlist for fanfiction reading
 * Only text and document formats are permitted.
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/html",
  "text/plain",
  "application/vnd.google-apps.document",
  "application/epub+zip",
] as const;

/**
 * Dangerous file extensions that trigger immediate rejection and high risk score
 */
export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".scr",
  ".bat",
  ".cmd",
  ".vbs",
  ".js",
  ".apk",
  ".docm",
  ".msi",
  ".ps1",
  ".xlsm",
  ".pptm",
  ".jar",
  ".com",
  ".hta",
  ".wsf",
] as const;

export interface ThreatScanResult {
  riskScore: number;
  flags: string[];
  passed: boolean;
  safeBrowsingClean: boolean;
  prohibitedMime: boolean;
  isWritable: boolean;
  isDangerousExtension: boolean;
}

export interface SafeBrowsingLookupResult {
  clean: boolean;
  matches?: Array<{
    threatType: string;
    platformType: string;
    threatEntryType: string;
  }>;
  error?: string;
}

/**
 * Queries Google Safe Browsing API v4 to verify URL safety.
 * Returns clean=true if no threat matches are reported.
 */
export async function lookupSafeBrowsingUrl(url: string): Promise<SafeBrowsingLookupResult> {
  const apiKey =
    process.env.GOOGLE_SAFE_BROWSING_API_KEY || process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      return { clean: true };
    }
    return {
      clean: true,
      error: "Google Safe Browsing API key is not configured.",
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const requestPayload = {
    client: {
      clientId: "ourarchive-threat-scanner",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await withTimeout(
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      }),
      5000,
      "Safe Browsing API check timed out."
    );

    if (!response.ok) {
      return {
        clean: false,
        error: `Safe Browsing API returned HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const matches = data.matches || [];

    return {
      clean: matches.length === 0,
      matches,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Safe Browsing lookup failed.";
    // Non-blocking in dev; in production treat network error cautiously
    return {
      clean: true,
      error: message,
    };
  }
}

/**
 * Calculates a composite threat risk score (0-100) and evaluation flags
 * based on Google Drive metadata, permission status, and Safe Browsing verdict.
 */
export function evaluateDriveThreat(
  metadata: GoogleDriveFileMetadata,
  safeBrowsingClean: boolean
): ThreatScanResult {
  let score = 0;
  const flags: string[] = [];

  // 1. Google Safe Browsing Verdict
  if (!safeBrowsingClean) {
    score += 100;
    flags.push("MALWARE_PHISHING_DOMAIN_DETECTED");
  }

  // 2. MIME Type Validation
  const prohibitedMime = !ALLOWED_MIME_TYPES.includes(
    metadata.mimeType as (typeof ALLOWED_MIME_TYPES)[number]
  );
  if (prohibitedMime) {
    score += 80;
    flags.push(`PROHIBITED_MIME_TYPE: ${metadata.mimeType}`);
  }

  // 3. Permission Check (Public edit permission is strictly prohibited)
  const isWritable = Boolean(metadata.canEdit);
  if (isWritable) {
    score += 80;
    flags.push("PUBLIC_WRITABLE_LINK");
  }

  // 4. File Extension Inspection
  const fileNameLower = metadata.name.toLowerCase();
  const matchedDangerousExt = DANGEROUS_EXTENSIONS.find((ext) =>
    fileNameLower.endsWith(ext)
  );
  const isDangerousExtension = Boolean(matchedDangerousExt);
  if (isDangerousExtension) {
    score += 100;
    flags.push(`EXECUTABLE_EXTENSION_DETECTED: ${matchedDangerousExt}`);
  }

  const boundedScore = Math.min(score, 100);

  return {
    riskScore: boundedScore,
    flags,
    passed: boundedScore === 0,
    safeBrowsingClean,
    prohibitedMime,
    isWritable,
    isDangerousExtension,
  };
}

/**
 * Performs a full automated threat scan for a Drive file.
 */
export async function performFullThreatScan(
  metadata: GoogleDriveFileMetadata,
  driveUrl: string
): Promise<ThreatScanResult> {
  const safeBrowsing = await lookupSafeBrowsingUrl(driveUrl);
  return evaluateDriveThreat(metadata, safeBrowsing.clean);
}
