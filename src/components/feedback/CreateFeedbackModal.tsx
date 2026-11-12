"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { FeedbackItemDto } from "@/types/feedback";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  displayName: string;
  onClose: () => void;
  onSuccess: (created: FeedbackItemDto) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export function CreateFeedbackModal({
  isOpen,
  displayName,
  onClose,
  onSuccess,
}: CreateFeedbackModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setDescription("");
      setRating(5);
      setHoverRating(null);
      setIsAnonymous(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !mounted) return null;

  const activeRating = hoverRating ?? rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (trimmedSubject.length < 3 || trimmedSubject.length > 150) {
      setError("Subject must be between 3 and 150 characters.");
      return;
    }

    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      setError("Description must be between 10 and 2000 characters.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: trimmedSubject,
          description: trimmedDescription,
          rating,
          isAnonymous,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      onSuccess(data.feedback as FeedbackItemDto);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-feedback-modal-title"
    >
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-border-light dark:border-border-dark overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="bg-brand-trunk text-white px-4 sm:px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base" aria-hidden="true">💬</span>
            <h2 id="create-feedback-modal-title" className="text-sm sm:text-base font-bold truncate">
              Submit Feedback
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-white/80 hover:text-white text-xl leading-none font-bold px-1 transition cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="feedback-subject"
                  className="block text-xs font-semibold text-gray-800 dark:text-gray-200"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  {subject.trim().length}/150
                </span>
              </div>
              <input
                id="feedback-subject"
                type="text"
                required
                minLength={3}
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-trunk text-xs"
              />
            </div>

            {/* Rating (1-5 Stars + Number Selector) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Rating (1–5) <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] font-semibold text-brand-trunk dark:text-brand-light">
                  {activeRating} / 5 &bull; {RATING_LABELS[activeRating]}
                </span>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark"
                role="radiogroup"
                aria-label="Rating from 1 to 5 stars"
              >
                {/* Interactive Stars */}
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`Rate ${star} out of 5 stars`}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                        className={`min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-md text-xl transition cursor-pointer ${
                          filled
                            ? "text-amber-500 scale-105"
                            : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>

                {/* Numeric Pills (1-5) */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] rounded-md text-xs font-bold border transition cursor-pointer ${
                        rating === num
                          ? "bg-brand-trunk text-white border-brand-trunk shadow-2xs"
                          : "bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-border-light dark:border-border-dark hover:bg-subtle-light dark:hover:bg-subtle-dark"
                      }`}
                      aria-label={`Select numeric rating ${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="feedback-description"
                  className="block text-xs font-semibold text-gray-800 dark:text-gray-200"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  {description.trim().length}/2000
                </span>
              </div>
              <textarea
                id="feedback-description"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share details, suggestions, bugs, or thoughts about OurArchive (min 10 characters)..."
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-trunk text-xs resize-y min-h-[100px]"
              />
            </div>

            {/* Author Identity Toggle (Display Name default vs Anonymous) */}
            <div className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-subtle-light/50 dark:bg-subtle-dark/50 space-y-2">
              <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Posting Identity
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <label
                  className={`flex-1 flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition ${
                    !isAnonymous
                      ? "border-brand-trunk bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 font-semibold"
                      : "border-border-light dark:border-border-dark text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="feedback-identity"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="accent-brand-trunk"
                  />
                  <span className="truncate">Use display name ({displayName})</span>
                </label>
                <label
                  className={`flex-1 flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition ${
                    isAnonymous
                      ? "border-brand-trunk bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100 font-semibold"
                      : "border-border-light dark:border-border-dark text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="feedback-identity"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="accent-brand-trunk"
                  />
                  <span>Post anonymously</span>
                </label>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {isAnonymous
                  ? "Your display name and account ID will remain hidden on the community feedback list."
                  : `Your feedback will be displayed under "${displayName}".`}
              </p>
            </div>
          </div>

          {/* Responsive Action Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-brand-trunk hover:bg-brand-bark text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
