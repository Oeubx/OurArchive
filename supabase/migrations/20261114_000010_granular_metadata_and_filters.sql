-- =============================================================================
-- Migration: 20261114_000010_granular_metadata_and_filters.sql
-- Description: Granular Fanwork Metadata (Categories, Warnings, Characters,
--              Relationships, Completion Status) and GIN Filter Indexes
-- Backlog Items: [OA-M2-F2], [OA-M2-F3]
-- =============================================================================

-- 1. Extend link_metadata with granular catalog columns
ALTER TABLE public.link_metadata
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS characters TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS warnings TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS relationships TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';

-- 2. GIN Indexes for Fast Array Inclusions & Filtering
CREATE INDEX IF NOT EXISTS idx_link_metadata_categories 
ON public.link_metadata USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_link_metadata_characters 
ON public.link_metadata USING GIN (characters);

CREATE INDEX IF NOT EXISTS idx_link_metadata_warnings 
ON public.link_metadata USING GIN (warnings);

CREATE INDEX IF NOT EXISTS idx_link_metadata_relationships 
ON public.link_metadata USING GIN (relationships);

CREATE INDEX IF NOT EXISTS idx_link_metadata_is_complete 
ON public.link_metadata (is_complete);

-- 3. Drop existing views to allow reordering and adding new columns cleanly
DROP VIEW IF EXISTS public.vw_public_search_feed CASCADE;
DROP VIEW IF EXISTS public.vw_admin_triage_feed CASCADE;

-- 4. Recreate vw_public_search_feed with Granular Metadata
CREATE VIEW public.vw_public_search_feed 
WITH (security_invoker = true) AS
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
    
    -- Granular fanwork categorization fields
    COALESCE(lm.categories, '{}'::TEXT[]) AS categories,
    COALESCE(lm.characters, '{}'::TEXT[]) AS characters,
    COALESCE(lm.warnings, '{}'::TEXT[]) AS warnings,
    COALESCE(lm.relationships, '{}'::TEXT[]) AS relationships,
    COALESCE(lm.is_complete, FALSE) AS is_complete,
    COALESCE(lm.language, 'English') AS language,
    
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

-- 5. Recreate vw_admin_triage_feed with Granular Metadata
CREATE VIEW public.vw_admin_triage_feed 
WITH (security_invoker = true) AS
SELECT 
    dl.id AS link_id,
    dl.drive_url,
    dl.google_file_id,
    dl.upload_mode,
    dl.verification_status,
    dl.is_hidden,
    dl.is_removed,
    dl.created_at,
    dl.updated_at,
    
    -- Metadata
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.pairing,
    lm.rating,
    lm.word_count,
    lm.summary,
    lm.tags,
    lm.canonical_source_url,
    lm.file_name,
    lm.mime_type,
    lm.file_size_bytes,
    lm.drive_owner_name,
    lm.drive_owner_email,
    lm.is_owner_masked,
    
    -- Granular fields
    COALESCE(lm.categories, '{}'::TEXT[]) AS categories,
    COALESCE(lm.characters, '{}'::TEXT[]) AS characters,
    COALESCE(lm.warnings, '{}'::TEXT[]) AS warnings,
    COALESCE(lm.relationships, '{}'::TEXT[]) AS relationships,
    COALESCE(lm.is_complete, FALSE) AS is_complete,
    COALESCE(lm.language, 'English') AS language,
    
    -- Verification metrics
    lv.id AS verification_id,
    COALESCE(lv.automated_risk_score, 0) AS automated_risk_score,
    COALESCE(lv.automated_flags, '[]'::JSONB) AS automated_flags,
    COALESCE(lv.scanner_passed, FALSE) AS scanner_passed,
    lv.admin_verified_by,
    lv.admin_verified_at,
    lv.admin_notes,
    COALESCE(lv.verification_badge, 'UNVERIFIED') AS verification_badge,
    
    -- Profile metrics
    up.display_name AS uploader_display_name,
    up.role AS uploader_role,
    COALESCE(up.is_banned, FALSE) AS uploader_is_banned,
    COALESCE(up.submission_count, 0) AS uploader_submission_count

FROM public.drive_links dl
LEFT JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id
LEFT JOIN public.user_profiles up ON dl.uploader_user_id = up.id
WHERE dl.is_removed = FALSE;
