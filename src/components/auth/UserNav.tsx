"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutUser } from "@/lib/services/auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { AssistedIntakeModal } from "@/components/upload/AssistedIntakeModal";
import { getCurrentUserRole, subscribeToRbacUpdates } from "@/lib/rbacService";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssistedModal, setShowAssistedModal] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("contributor");

  useEffect(() => {
    const supabase = createClient();

    function updateUserInfo(usr: User | null) {
      setUser(usr);
      const devRole = typeof window !== "undefined" ? localStorage.getItem("ourarchive_dev_role") : null;
      if (devRole) {
        setActiveRole(devRole);
      } else if (usr?.app_metadata?.role) {
        setActiveRole(usr.app_metadata.role as string);
      } else if (usr) {
        setActiveRole("contributor");
      } else {
        setActiveRole(getCurrentUserRole());
      }
    }

    // Fetch initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      updateUserInfo(user);
      setLoading(false);
    });

    // Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserInfo(session?.user ?? null);
      setLoading(false);
    });

    const unsubscribeRbac = subscribeToRbacUpdates(() => {
      setActiveRole(getCurrentUserRole());
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeRbac();
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

  const isAdmin = activeRole === "admin";
  const isVerifier = activeRole === "verifier";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Archivist";

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-2.5 py-1 text-xs font-semibold bg-white text-ao3-red hover:bg-amber-50 rounded shadow-xs transition flex items-center gap-1"
          >
            <span>+</span> Submit Work
          </button>

          {isVerifier && (
            <Link
              href="/manage"
              className="px-2 py-0.5 text-xs bg-emerald-500 text-white font-semibold rounded hover:bg-emerald-600 transition"
            >
              Verifier Triage
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="px-2 py-0.5 text-xs bg-amber-400 text-amber-950 font-semibold rounded hover:bg-amber-300 transition"
            >
              Admin Triage
            </Link>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <Link
              href="/profile"
              className="font-medium text-white hover:underline"
              title="View your archivist profile"
            >
              {displayName}
            </Link>
            <span className="text-[10px] bg-red-800 text-amber-200 px-1.5 py-0.2 rounded uppercase">
              {activeRole}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="text-xs text-red-200 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1 text-xs font-semibold bg-white text-ao3-red hover:bg-amber-50 rounded shadow-xs transition"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Upload Modal with Link Segmenter */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* Assisted Intake Modal */}
      <AssistedIntakeModal
        isOpen={showAssistedModal}
        onClose={() => setShowAssistedModal(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
