import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache for Edge Middleware instances
const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodic garbage collection for memory hygiene
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function purgeExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}

function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  purgeExpiredEntries(now);

  const current = rateLimitMap.get(identifier);

  if (!current || now > current.resetAt) {
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(identifier, entry);
    return {
      allowed: true,
      remaining: limit - 1,
      reset: Math.ceil(windowMs / 1000),
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    reset: Math.ceil((current.resetAt - now) / 1000),
  };
}

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const { pathname } = request.nextUrl;

  // Rate-limiting Rule 1: Public Search Queries (/api/search*) -> max 60 req/min
  if (pathname.startsWith("/api/search")) {
    const limit = 60;
    const windowMs = 60 * 1000;
    const result = checkRateLimit(`search:${ip}`, limit, windowMs);

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          retryAfterSeconds: result.reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": result.reset.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Rate-limiting Rule 2: Drive Link Reveals (/api/links/reveal*) -> max 10 req/min
  if (pathname.startsWith("/api/links/reveal")) {
    const limit = 10;
    const windowMs = 60 * 1000;
    const result = checkRateLimit(`reveal:${ip}`, limit, windowMs);

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Drive link reveal rate limit reached. Please pause for 1 minute.",
          retryAfterSeconds: result.reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": result.reset.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // Refresh Supabase auth session cookies
  const { supabaseResponse, user } = await updateSession(request);

  // Admin Route Protection Rule: Enforce RBAC on /admin/* (except /admin/unauthorized)
  if (pathname.startsWith("/admin") && pathname !== "/admin/unauthorized") {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("auth_error", "admin_login_required");
      return NextResponse.redirect(redirectUrl);
    }

    const role = user.app_metadata?.role as string | undefined;
    if (role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/unauthorized";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Apply emergency platform headers
  supabaseResponse.headers.set("X-Platform-Scope", "OurArchive-Emergency-Bridge");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
