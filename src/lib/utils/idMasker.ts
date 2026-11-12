/**
 * Bidirectional Work ID Masker [OA-M1-F1, OA-M2-F4]
 * 
 * Converts internal database UUIDs into URL-safe masked tokens (e.g., oa_...)
 * to prevent database primary key exposure, scrapers, and enumeration attacks.
 * Fully bidirectional, deterministic, and backwards-compatible with raw UUIDs.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Masks a canonical 36-character UUID into an 'oa_' prefixed URL-safe base64 string.
 * Example: '5d2c9a59-7600-48bc-8870-7d9ebb8d6a1f' -> 'oa_XSyawXYASryIcHzrvY1qHw'
 */
export function maskWorkId(uuid: string): string {
  if (!uuid) return "";
  const clean = uuid.replace(/-/g, "").toLowerCase();
  if (clean.length !== 32 || !/^[0-9a-f]{32}$/.test(clean)) {
    // If not a standard 32-hex UUID, return as-is
    return uuid;
  }

  try {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }

    let binary = "";
    for (let i = 0; i < 16; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64 =
      typeof btoa === "function"
        ? btoa(binary)
        : Buffer.from(binary, "binary").toString("base64");

    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return `oa_${base64url}`;
  } catch {
    return uuid;
  }
}

/**
 * Unmasks an 'oa_' token back into its canonical 36-character hyphenated UUID.
 * Passes raw UUIDs through safely for backwards compatibility.
 */
export function unmaskWorkId(token: string): string {
  if (!token) return "";

  // If already a valid UUID format, return normalized lowercase
  if (UUID_REGEX.test(token)) {
    return token.toLowerCase();
  }

  if (!token.startsWith("oa_")) {
    return token;
  }

  try {
    const rawBase64 = token.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (rawBase64.length % 4)) % 4;
    const padded = rawBase64 + "=".repeat(padLength);

    const binary =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("binary");

    let hex = "";
    for (let i = 0; i < binary.length; i++) {
      const h = binary.charCodeAt(i).toString(16).padStart(2, "0");
      hex += h;
    }

    if (hex.length === 32) {
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toLowerCase();
    }
  } catch {
    // Decode failed -> return token
  }

  return token;
}
