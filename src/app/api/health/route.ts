import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/config";
import { withTimeout } from "@/lib/utils/with-timeout";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let supabaseConnected = false;
  let errorNotice: string | undefined;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    try {
      const pingUrl = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/health`;
      const res = await withTimeout(
        fetch(pingUrl, {
          headers: {
            apikey: anonKey,
          },
          cache: "no-store",
        }),
        3500,
        "Supabase health probe timed out after 3.5s"
      );

      supabaseConnected = res.ok;
    } catch (err: unknown) {
      supabaseConnected = false;
      errorNotice =
        err instanceof Error ? err.message : "Database gateway unreachable";
    }
  } else {
    errorNotice = "Supabase environment variables are unconfigured";
  }

  const isHealthy = supabaseConnected;

  const responseBody = {
    status: isHealthy ? "ok" : "degraded",
    timestamp,
    version: APP_VERSION,
    platform: "OurArchive Emergency System",
    services: {
      supabase: supabaseConnected,
      edgeMiddleware: true,
    },
    ...(errorNotice && !isHealthy ? { warning: errorNotice } : {}),
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Platform-Scope": "OurArchive-Emergency-Bridge",
    },
  });
}
