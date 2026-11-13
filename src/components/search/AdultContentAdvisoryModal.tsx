"use client";

import React from "react";
import { createPortal } from "react-dom";

interface AdultContentAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdultContentAdvisoryModal({
  isOpen,
  onClose,
  onConfirm,
}: AdultContentAdvisoryModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adult-advisory-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-surface-light dark:bg-surface-dark border border-red-300 dark:border-red-900/60 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔞</span>
            <h2 id="adult-advisory-title" className="text-sm font-bold tracking-wide">
              Adult Content Advisory (18+)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold transition cursor-pointer"
            aria-label="Close adult content advisory"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs leading-relaxed">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded text-red-900 dark:text-red-200 space-y-1">
            <span className="font-bold block text-[11px] uppercase tracking-wide">
              Age-Restricted Category
            </span>
            <p>
              Works classified under <strong>NSFW</strong> contain mature themes, graphic content, or explicit romance intended strictly for adults.
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            To view these works, please confirm that you are at least 18 years of age (or the legal age of majority in your jurisdiction). Your confirmation will be remembered for your browsing session.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border-light dark:border-border-dark">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark font-medium transition cursor-pointer"
            >
              Cancel &amp; Keep SFW
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:w-auto px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>I am 18+ — Show NSFW</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
