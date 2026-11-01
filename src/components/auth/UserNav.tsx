"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutUser } from "@/lib/services/auth";
import { AuthModal } from "@/components/auth/AuthModal";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      await signOutUser();
      window.location.reload();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-red-800/40 animate-pulse rounded text-xs" />
      </div>
    );
  }

  const role = user?.app_metadata?.role as string | undefined;
  const isAdmin = role === "admin";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Archivist";

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-2 py-0.5 text-xs bg-amber-400 text-amber-950 font-semibold rounded hover:bg-amber-300 transition"
            >
              Admin Triage
            </Link>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-white">{displayName}</span>
            <span className="text-[10px] bg-red-800 text-amber-200 px-1.5 py-0.2 rounded uppercase">
              {role ?? "user"}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="text-xs text-red-200 hover:text-white underline transition"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-semibold bg-white text-ao3-red hover:bg-amber-50 px-3 py-1 rounded shadow-xs transition"
        >
          Sign In
        </button>
      )}

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
