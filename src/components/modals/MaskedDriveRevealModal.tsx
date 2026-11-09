"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MaskedDriveRevealModalProps {
  isOpen: boolean;
  workId: string | null;
  onClose: () => void;
}

interface RevealData {
  workId: string;
  driveUrl: string;
  title: string;
  authorName: string;
  displayOwner: string;
  verificationBadge: string;
  riskScore: number;
  safetyDisclaimer: string;
}

export function MaskedDriveRevealModal({ isOpen, workId, onClose }: MaskedDriveRevealModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevealData | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !workId) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/links/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workId }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to reveal Google Drive link.");
        }
        setData(json);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error revealing link.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, workId]);

  if (!isOpen || !mounted) return null;

  function handleCopy() {
    if (data?.driveUrl) {
      navigator.clipboard.writeText(data.driveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
        <div className="bg-brand-trunk text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">🔗 View Verified Google Drive Link</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-5 text-xs text-gray-800 space-y-4">
          {loading && (
            <div className="py-8 text-center text-gray-500 space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-brand-trunk border-t-transparent rounded-full animate-spin" />
              <p>Verifying anti-bot token and resolving Drive path...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {data && (
            <>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-950 text-[11px] leading-relaxed">
                <strong>Safety Notice:</strong> {data.safetyDisclaimer}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Work:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[260px]">{data.title}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Author:</span>
                  <span className="text-gray-900">{data.authorName}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Drive Owner:</span>
                  <span className="text-gray-900">{data.displayOwner}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Verification:</span>
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-semibold text-[10px]">
                    {data.verificationBadge} (Risk: {data.riskScore}/100)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Canonical Google Drive URL:</label>
                <div className="p-2 bg-gray-100 border border-gray-300 rounded font-mono text-[11px] break-all select-all text-gray-800">
                  {data.driveUrl}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 transition"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Link"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition"
                  >
                    Close
                  </button>
                  <a
                    href={data.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 text-xs font-semibold bg-brand-trunk hover:bg-brand-bark text-white rounded shadow-xs transition"
                  >
                    Open in Google Drive (Read-Only) &rarr;
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
