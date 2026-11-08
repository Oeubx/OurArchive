-- =============================================================================
-- Migration: 20261108_000007_multi_fic_drive_and_takedown_support.sql
-- Description: Multi-Fanfic Cloud Storage & Granular Single-Work Takedown Support
-- Backlog Item: [OA-M3-F5]
-- =============================================================================

-- 1. Drop the unconditional single-link UNIQUE constraint on drive_url
-- This allows multiple distinct fanworks (e.g., chapters or distinct stories in a OneDrive/Drive folder)
-- to be indexed as separate items while sharing the same cloud drive root.
ALTER TABLE public.drive_links 
    DROP CONSTRAINT IF EXISTS drive_links_drive_url_key;

-- 2. Add an efficient non-unique b-tree index on drive_url for fast reverse-lookups
CREATE INDEX IF NOT EXISTS idx_drive_links_drive_url 
    ON public.drive_links(drive_url);

-- 3. Composite index on drive_url and is_removed / is_hidden to optimize multi-fic takedowns
CREATE INDEX IF NOT EXISTS idx_drive_links_url_status 
    ON public.drive_links(drive_url, is_hidden, is_removed);

COMMENT ON COLUMN public.drive_links.drive_url IS 
    'Cloud storage URL (Google Drive or OneDrive). Non-unique to allow multiple fanworks from a shared folder.';
