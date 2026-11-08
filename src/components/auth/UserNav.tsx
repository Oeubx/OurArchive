"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutUser } from "@/lib/services/auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { UploadModal } from "@/components/upload/UploadModal";
import { AssistedIntakeModal } from "@/components/upload/AssistedIntakeModal";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssistedModal, setShowAssistedModal] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("guest");

  useEffect(() => {
    const supabase = createClient();

    function updateUserInfo(usr: User | null) {
      setUser(usr);
      if (usr?.app_metadata?.role) {
        setActiveRole(usr.app_metadata.role as string);
      } else if (usr) {
        setActiveRole("contributor");
      } else {
        setActiveRole("guest");
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
        <div className="h-6 w-16 bg-brand-bark/40 animate-pulse rounded text-xs" />
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Archivist";

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-2.5">
          {/* Profile Identity Pill */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/profile"
              className="text-xs font-semibold text-white hover:text-amber-200 transition"
              title="View your archivist profile"
            >
              {displayName}
            </Link>
            <span className="text-[10px] bg-brand-bark text-amber-200 px-1.5 py-0.2 rounded uppercase border border-brand-amber font-mono">
              {activeRole}
            </span>
          </div>

          {/* Symmetrical Prominent Button: SIGN OUT */}
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-xs font-semibold bg-white text-brand-trunk hover:bg-amber-50 rounded shadow-xs transition"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Symmetrical Prominent Button: SIGN IN */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1 text-xs font-semibold bg-white text-brand-trunk hover:bg-amber-50 rounded shadow-xs transition"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Upload Modal */}
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
