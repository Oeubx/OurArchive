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
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_public_search_feed 
WITH (security_invoker = true) AS
SELECT 
    dl.id AS work_id,
    dl.drive_url,
    dl.google_file_id,
    dl.uploader_user_id,
    dl.created_at AS uploaded_at,
    dl.takedown_flagged_at,
    dl.takedown_deadline,
    
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.pairing,
    lm.rating,
    lm.tags,
    lm.summary,
    lm.canonical_source_url,
    lm.word_count,
    lm.mime_type,
    lm.file_size_bytes,
    
    CASE 
        WHEN dl.upload_mode = 'assisted_admin' THEN 'ARCHIVE_CURATOR'
        ELSE COALESCE(up.display_name, 'COMMUNITY_BACKUP')
    END AS display_drive_owner,
    
    COALESCE(lv.verification_badge, 'UNVERIFIED') AS verification_badge,
    lv.admin_verified_at,
    COALESCE(lv.automated_risk_score, 0) AS automated_risk_score,
    
    -- Drive path reveal token (obfuscated sha256 reference, not raw URL)
    encode(digest(dl.drive_url, 'sha256'), 'hex') AS path_reveal_token

FROM public.drive_links dl
JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.user_profiles up ON dl.uploader_user_id = up.id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id
WHERE dl.verification_status = 'verified'
  AND dl.is_hidden = FALSE
  AND dl.is_removed = FALSE
  AND (dl.takedown_deadline IS NULL OR dl.takedown_deadline > now());
