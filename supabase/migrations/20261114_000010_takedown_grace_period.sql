-- =============================================================================
-- Migration: 20261114_000010_takedown_grace_period.sql
-- Description:
--   1. Add takedown_flagged_at and takedown_deadline to public.drive_links
--   2. Index on takedown_deadline for efficient timeout queries
--   3. Update public.vw_public_search_feed to expose takedown columns and
--      automatically filter out works whose 3-hour takedown deadline has passed
-- =============================================================================

ALTER TABLE public.drive_links
ADD COLUMN IF NOT EXISTS takedown_flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS takedown_deadline TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drive_links_takedown_deadline
ON public.drive_links (takedown_deadline)
WHERE takedown_deadline IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Update Public Search Projection View
-- Drop with CASCADE to prevent PostgreSQL 42P16 column positional rename error
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_public_search_feed CASCADE;

CREATE VIEW public.vw_public_search_feed 
WITH (security_invoker = true) AS
SELECT 
    dl.id AS work_id,
    dl.upload_mode,
    dl.created_at AS uploaded_at,
    dl.takedown_flagged_at,
    dl.takedown_deadline,
    
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
  AND dl.is_removed = FALSE
  AND (dl.takedown_deadline IS NULL OR dl.takedown_deadline > now());

GRANT SELECT ON public.vw_public_search_feed TO anon, authenticated, service_role;
