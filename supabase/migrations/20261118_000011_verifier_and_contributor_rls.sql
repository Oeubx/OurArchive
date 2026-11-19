-- =============================================================================
-- Migration: 20261118_000011_verifier_and_contributor_rls.sql
-- Module: Module 3 - Verification & Safety / Module 2 - Personal Contributions
-- Purpose: Allow authentic contributors to SELECT their own unverified submissions
--          and grant verifiers SELECT permissions over triage drive_links,
--          link_metadata, and link_verifications.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Policies: public.drive_links
-- -----------------------------------------------------------------------------

-- Contributors can view their own submissions regardless of verification status
DROP POLICY IF EXISTS "Contributors can view own submissions" ON public.drive_links;
CREATE POLICY "Contributors can view own submissions"
ON public.drive_links
FOR SELECT
TO authenticated
USING (auth.uid() = uploader_user_id);

-- Verifiers can view all non-removed submissions in triage queue
DROP POLICY IF EXISTS "Verifiers can view triage queue" ON public.drive_links;
CREATE POLICY "Verifiers can view triage queue"
ON public.drive_links
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('verifier', 'admin')
          AND user_profiles.is_banned = FALSE
    )
);

-- -----------------------------------------------------------------------------
-- 2. Policies: public.link_metadata
-- -----------------------------------------------------------------------------

-- Contributors can view metadata for their own submissions
DROP POLICY IF EXISTS "Contributors can view own link_metadata" ON public.link_metadata;
CREATE POLICY "Contributors can view own link_metadata"
ON public.link_metadata
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_metadata.link_id
          AND dl.uploader_user_id = auth.uid()
    )
);

-- Verifiers can view metadata for all submissions
DROP POLICY IF EXISTS "Verifiers can view triage link_metadata" ON public.link_metadata;
CREATE POLICY "Verifiers can view triage link_metadata"
ON public.link_metadata
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('verifier', 'admin')
          AND user_profiles.is_banned = FALSE
    )
);

-- -----------------------------------------------------------------------------
-- 3. Policies: public.link_verifications
-- -----------------------------------------------------------------------------

-- Contributors can view verification badges and risk assessments of their own works
DROP POLICY IF EXISTS "Contributors can view own link_verifications" ON public.link_verifications;
CREATE POLICY "Contributors can view own link_verifications"
ON public.link_verifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_verifications.link_id
          AND dl.uploader_user_id = auth.uid()
    )
);

-- Verifiers can view verification records for all submissions
DROP POLICY IF EXISTS "Verifiers can view triage link_verifications" ON public.link_verifications;
CREATE POLICY "Verifiers can view triage link_verifications"
ON public.link_verifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('verifier', 'admin')
          AND user_profiles.is_banned = FALSE
    )
);
