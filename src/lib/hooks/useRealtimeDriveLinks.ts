"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DriveLinkRecord } from "@/types/database";

export interface RealtimeDriveLinksOptions {
  filter?: string;
  enabled?: boolean;
}

/**
 * Resilient React hook for Supabase Realtime Postgres Changes on the `drive_links` table.
 * Automatically unsubscribes on unmount and guards against stale event closures.
 */
export function useRealtimeDriveLinks(
  onEvent: (payload: RealtimePostgresChangesPayload<DriveLinkRecord>) => void,
  options: RealtimeDriveLinksOptions = {}
) {
  const { filter, enabled = true } = options;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const channelName = filter
      ? `realtime:drive_links:${filter}:${randomSuffix}`
      : `realtime:drive_links:all:${randomSuffix}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drive_links",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onEventRef.current(payload as RealtimePostgresChangesPayload<DriveLinkRecord>);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn("Supabase Realtime subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, enabled]);
}
