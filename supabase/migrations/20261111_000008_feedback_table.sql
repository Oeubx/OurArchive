-- =============================================================================
-- Migration: 20261111_000008_feedback_table.sql
-- Description: Signed-in-only user feedback table and strict RLS policies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL CHECK (char_length(trim(subject)) >= 3),
    description TEXT NOT NULL CHECK (
        char_length(trim(description)) >= 10 AND char_length(description) <= 2000
    ),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for newest-first sorting and rating filtering
CREATE INDEX IF NOT EXISTS idx_feedback_created_at
    ON public.feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_rating_created_at
    ON public.feedback(rating, created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can submit feedback for themselves
DROP POLICY IF EXISTS "Authenticated users can insert own feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert own feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Direct table reads are limited to the author or admins (protects anonymous user_id)
DROP POLICY IF EXISTS "Users can view own feedback or admins can view all" ON public.feedback;
CREATE POLICY "Users can view own feedback or admins can view all"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Only admins can delete feedback if moderation is needed
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;
CREATE POLICY "Admins can delete feedback"
    ON public.feedback
    FOR DELETE
    TO authenticated
    USING (public.is_admin());
