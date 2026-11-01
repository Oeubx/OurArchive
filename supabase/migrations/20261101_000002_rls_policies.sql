-- =============================================================================
-- Migration: 20261101_000002_rls_policies.sql
-- Description: Strict Row-Level Security (RLS) policies for OurArchive
-- Specifications: docs/database/schema_definition.md
-- Backlog Item: [OA-M1-F4]
-- =============================================================================

-- Enable Row-Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if the executing user possesses the admin role in JWT or profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        COALESCE(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 1. Policies: public.user_profiles
-- -----------------------------------------------------------------------------
-- Anyone can view user profile display names and roles (for contributor attribution)
CREATE POLICY "Public user profile read access"
ON public.user_profiles
FOR SELECT
TO anon, authenticated
USING (TRUE);

-- Authenticated users can update their own profile (e.g. display name)
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins retain full operational management over user profiles
CREATE POLICY "Admins full management of user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. Policies: public.drive_links
-- -----------------------------------------------------------------------------
-- Public readers can query only verified, unhidden, and non-removed works
CREATE POLICY "Public readers can view verified active works"
ON public.drive_links
FOR SELECT
TO anon, authenticated
USING (
    verification_status = 'verified' 
    AND is_hidden = FALSE 
    AND is_removed = FALSE
);

-- Authenticated users (not banned) can submit links as uploader
CREATE POLICY "Authenticated non-banned users can submit links"
ON public.drive_links
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = uploader_user_id 
    AND EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.is_banned = FALSE
    )
);

-- Contributors can update their own submissions (e.g. hide or update metadata)
CREATE POLICY "Contributors can update own submissions"
ON public.drive_links
FOR UPDATE
TO authenticated
USING (auth.uid() = uploader_user_id)
WITH CHECK (auth.uid() = uploader_user_id);

-- Admins have full access across all drive links (including triage queue)
CREATE POLICY "Admins full access to drive_links"
ON public.drive_links
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Policies: public.link_metadata
-- -----------------------------------------------------------------------------
-- Public readers can read metadata for verified active works
CREATE POLICY "Public readers can view verified active metadata"
ON public.link_metadata
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_metadata.link_id
          AND dl.verification_status = 'verified'
          AND dl.is_hidden = FALSE
          AND dl.is_removed = FALSE
    )
);

-- Contributors can insert metadata for links they uploaded
CREATE POLICY "Contributors can insert metadata for own links"
ON public.link_metadata
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_metadata.link_id
          AND dl.uploader_user_id = auth.uid()
    )
);

-- Contributors can update metadata for their own uploads
CREATE POLICY "Contributors can update metadata for own links"
ON public.link_metadata
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_metadata.link_id
          AND dl.uploader_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_metadata.link_id
          AND dl.uploader_user_id = auth.uid()
    )
);

-- Admins have full access to metadata
CREATE POLICY "Admins full access to link_metadata"
ON public.link_metadata
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Policies: public.link_verifications
-- -----------------------------------------------------------------------------
-- Public readers can view verification badges for verified active works
CREATE POLICY "Public readers can view verified active badges"
ON public.link_verifications
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.drive_links dl
        WHERE dl.id = link_verifications.link_id
          AND dl.verification_status = 'verified'
          AND dl.is_hidden = FALSE
          AND dl.is_removed = FALSE
    )
);

-- Admins have full access to link verifications
CREATE POLICY "Admins full access to link_verifications"
ON public.link_verifications
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Policies: public.admin_actions
-- -----------------------------------------------------------------------------
-- Admins can query audit log records
CREATE POLICY "Admins can view admin_actions audit log"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert audit log records
CREATE POLICY "Admins can insert admin_actions audit entries"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND auth.uid() = admin_id);
