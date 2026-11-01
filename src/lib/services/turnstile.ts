/**
 * Cloudflare Turnstile Bot Deterrence Verification Service
 * Backlog Items: [OA-M2-F6], [OA-M3-F6]
 * Specifications: docs/architecture/drive_ingestion_and_search.md
 *                 docs/architecture/reader_and_anti_bot_protection.md
 */

import { withTimeout } from "@/lib/utils/with-timeout";

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
  hostname?: string;
  challengeTs?: string;
}

/**
 * Validates a client-side Cloudflare Turnstile challenge token.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // Development bypass if no key is configured
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    return {
      success: false,
      error: "Cloudflare Turnstile secret is not configured on the server.",
    };
  }

  // Cloudflare test keys (1x0000000000000000000000000000000AA always passes)
  if (!token) {
    return {
      success: false,
      error: "Turnstile challenge token is missing.",
    };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await withTimeout(
      fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
        cache: "no-store",
      }),
      5000,
      "Turnstile verification request timed out."
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Turnstile verification service responded with status ${response.status}`,
      };
    }

    const outcome = await response.json();

    if (!outcome.success) {
      const errorCodes = outcome["error-codes"] ? outcome["error-codes"].join(", ") : "invalid-input-response";
      return {
        success: false,
        error: `Bot verification failed (${errorCodes}).`,
      };
    }

    return {
      success: true,
      hostname: outcome.hostname,
      challengeTs: outcome.challenge_ts,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Turnstile verification failed.";
    return {
      success: false,
      error: message,
    };
  }
}
