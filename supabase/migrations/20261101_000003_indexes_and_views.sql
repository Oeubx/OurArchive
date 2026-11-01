-- =============================================================================
-- Migration: 20261101_000003_indexes_and_views.sql
-- Description: Performance indexes, full-text search, and projection views
-- Specifications: docs/database/indexes_and_performance.md
--                 docs/database/search_and_display_projection.md
-- Backlog Item: [OA-M1-F4]
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Full-Text Search TSVector & GIN Indexes
-- -----------------------------------------------------------------------------
ALTER TABLE public.link_metadata 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(fandom, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(author_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_link_metadata_search 
ON public.link_metadata USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_link_metadata_tags 
ON public.link_metadata USING GIN (tags);

-- -----------------------------------------------------------------------------
-- 2. Composite B-Tree Query & Filter Indexes
-- -----------------------------------------------------------------------------
-- Powers the public search feed without table scans
CREATE INDEX IF NOT EXISTS idx_drive_links_public_feed 
ON public.drive_links (verification_status, is_hidden, is_removed, created_at DESC);

-- Prevents duplicate uploads of identical Google Drive files while allowing re-upload if purged
CREATE UNIQUE INDEX IF NOT EXISTS idx_drive_links_file_id_active 
ON public.drive_links (google_file_id) 
WHERE is_removed = FALSE;

-- Accelerates admin triage review queue lookups
CREATE INDEX IF NOT EXISTS idx_drive_links_admin_queue 
ON public.drive_links (verification_status, created_at ASC) 
WHERE verification_status IN ('pending_scan', 'pending_review', 'flagged');

-- Lookup index on uploader ID
CREATE INDEX IF NOT EXISTS idx_drive_links_uploader 
ON public.drive_links (uploader_user_id);

-- Lookup index on verifications foreign key
CREATE INDEX IF NOT EXISTS idx_link_verifications_link_id 
ON public.link_verifications (link_id);

-- -----------------------------------------------------------------------------
-- 3. Search & Display Projection Views
-- -----------------------------------------------------------------------------

-- Public Search Feed Projection View
CREATE OR REPLACE VIEW public.vw_public_search_feed AS
SELECT 
    dl.id AS work_id,
    dl.upload_mode,
    dl.created_at AS uploaded_at,
    
    -- Displayed file fields
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.pairing,
    lm.rating,
    lm.word_count,
    lm.summary,
    lm.tags,
    lm.mime_type,
    
    -- File details & owner masking
    CASE 
        WHEN lm.is_owner_masked THEN 
            regexp_replace(lm.drive_owner_email, '(?<=^.{2}).*?(?=@)', '***')
        ELSE lm.drive_owner_name
    END AS display_drive_owner,
    
    COALESCE(lv.verification_badge, 'UNVERIFIED') AS verification_badge,
    lv.admin_verified_at,
    COALESCE(lv.automated_risk_score, 0) AS automated_risk_score,
    
    -- Drive path reveal token (obfuscated sha256 reference, not raw URL)
    encode(digest(dl.drive_url, 'sha256'), 'hex') AS path_reveal_token

FROM public.drive_links dl
JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id
WHERE dl.verification_status = 'verified'
  AND dl.is_hidden = FALSE
  AND dl.is_removed = FALSE;

-- Administrator Triage Queue Projection View
CREATE OR REPLACE VIEW public.vw_admin_triage_feed AS
SELECT 
    dl.id AS link_id,
    dl.drive_url,
    dl.google_file_id,
    dl.upload_mode,
    dl.verification_status,
    dl.is_hidden,
    dl.is_removed,
    dl.uploader_user_id,
    up.display_name AS uploader_name,
    dl.created_at AS submitted_at,
    
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.mime_type,
    lm.file_size_bytes,
    lm.drive_owner_email,
    
    lv.automated_risk_score,
    lv.automated_flags,
    lv.scanner_passed,
    lv.admin_notes

FROM public.drive_links dl
LEFT JOIN public.user_profiles up ON dl.uploader_user_id = up.id
LEFT JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id
WHERE dl.verification_status IN ('pending_scan', 'pending_review', 'flagged')
   OR dl.is_hidden = TRUE;
