-- =============================================================================
-- Migration: 20261112_000009_audit_tombstones_takedowns_bookmarks_and_rebrand.sql
-- Description:
--   1. Rename link_metadata.canonical_ao3_url -> canonical_source_url
--   2. Preserve immutable admin audit tombstones on hard delete (ON DELETE SET NULL + snapshots)
--   3. Create Supabase-backed public.takedown_requests queue with Drive target + ownership proof
--   4. Create Supabase-backed public.user_bookmarks table replacing localStorage persistence
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rename canonical_ao3_url -> canonical_source_url on public.link_metadata
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'link_metadata'
          AND column_name = 'canonical_ao3_url'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'link_metadata'
          AND column_name = 'canonical_source_url'
    ) THEN
        ALTER TABLE public.link_metadata
            RENAME COLUMN canonical_ao3_url TO canonical_source_url;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Audit Log Tombstones on public.admin_actions
--    Switch link_id FK from ON DELETE CASCADE to ON DELETE SET NULL and add
--    immutable snapshot columns so purged works stay in compliance exports.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.admin_actions'::regclass
          AND contype = 'f'
          AND confrelid = 'public.drive_links'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.admin_actions DROP CONSTRAINT %I', fk_record.conname);
    END LOOP;
END $$;

ALTER TABLE public.admin_actions
    ALTER COLUMN link_id DROP NOT NULL;

ALTER TABLE public.admin_actions
    ADD CONSTRAINT admin_actions_link_id_fkey
    FOREIGN KEY (link_id)
    REFERENCES public.drive_links(id)
    ON DELETE SET NULL;

ALTER TABLE public.admin_actions
    ADD COLUMN IF NOT EXISTS work_title_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS author_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS fandom_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS masked_url_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS is_tombstone BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_admin_actions_link_id
    ON public.admin_actions (link_id);

CREATE INDEX IF NOT EXISTS idx_admin_actions_executed_at
    ON public.admin_actions (executed_at DESC);

-- -----------------------------------------------------------------------------
-- 3. Table: public.takedown_requests
--    Stores every in-system takedown submission with targeted Drive URL and
--    a dedicated proof of ownership/credibility field for Admin review.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takedown_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.drive_links(id) ON DELETE SET NULL,
    target_query TEXT NOT NULL,
    submitted_drive_url TEXT,
    resolved_drive_url TEXT,
    work_title_snapshot TEXT,
    requester_role VARCHAR(30) NOT NULL DEFAULT 'author'
        CHECK (requester_role IN ('author', 'drive_owner', 'uploader', 'community')),
    requester_email VARCHAR(255),
    ownership_proof TEXT NOT NULL,
    removal_preference VARCHAR(20) NOT NULL DEFAULT 'permanent'
        CHECK (removal_preference IN ('permanent', 'hide')),
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'quarantined', 'purged', 'dismissed')),
    resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_takedown_requests_status
    ON public.takedown_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_takedown_requests_link_id
    ON public.takedown_requests (link_id);

ALTER TABLE public.takedown_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view takedown_requests" ON public.takedown_requests;
CREATE POLICY "Admins can view takedown_requests"
ON public.takedown_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update takedown_requests" ON public.takedown_requests;
CREATE POLICY "Admins can update takedown_requests"
ON public.takedown_requests
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Table: public.user_bookmarks
--    Replaces browser-local localStorage bookmarks with cross-device
--    Supabase persistence scoped strictly to the signed-in user.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    link_id UUID NOT NULL REFERENCES public.drive_links(id) ON DELETE CASCADE,
    work_title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL DEFAULT 'Unknown / Community Backup',
    fandom VARCHAR(255),
    scroll_percent NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (scroll_percent >= 0 AND scroll_percent <= 100),
    last_page INTEGER NOT NULL DEFAULT 1
        CHECK (last_page >= 1),
    is_pdf BOOLEAN NOT NULL DEFAULT FALSE,
    child_id VARCHAR(255),
    child_title VARCHAR(255),
    child_mime_type VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT user_bookmarks_user_link_unique UNIQUE (user_id, link_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_updated
    ON public.user_bookmarks (user_id, updated_at DESC);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can view own bookmarks"
ON public.user_bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can insert own bookmarks"
ON public.user_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can update own bookmarks"
ON public.user_bookmarks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
ON public.user_bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure privileges align with least-privilege RLS access
GRANT SELECT, UPDATE ON public.takedown_requests TO authenticated;
GRANT ALL ON public.takedown_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_bookmarks TO authenticated;
GRANT ALL ON public.user_bookmarks TO service_role;
