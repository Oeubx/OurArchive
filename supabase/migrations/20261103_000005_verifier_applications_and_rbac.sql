-- ==============================================================================
-- Migration: 20261103_000005_verifier_applications_and_rbac.sql
-- Description: Adds 'verifier' role to user_profiles and creates verifier_applications table with RLS
-- ==============================================================================

-- 1. Update user_profiles role check constraint to include 'verifier'
DO $$
BEGIN
    ALTER TABLE public.user_profiles 
        DROP CONSTRAINT IF EXISTS user_profiles_role_check;
        
    ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('user', 'contributor', 'verifier', 'admin'));
EXCEPTION
    WHEN undefined_table THEN
        -- If user_profiles doesn't exist yet, it will be handled by base migration
        NULL;
END $$;

-- 2. Create verifier_applications table
CREATE TABLE IF NOT EXISTS public.verifier_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    trust_pledge TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'declined')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS
ALTER TABLE public.verifier_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for verifier_applications
DROP POLICY IF EXISTS "Users can insert their own application" ON public.verifier_applications;
CREATE POLICY "Users can insert their own application"
    ON public.verifier_applications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own application" ON public.verifier_applications;
CREATE POLICY "Users can view their own application"
    ON public.verifier_applications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and manage all applications" ON public.verifier_applications;
CREATE POLICY "Admins can view and manage all applications"
    ON public.verifier_applications
    FOR ALL
    TO authenticated
    USING (
        coalesce(
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
            FALSE
        )
    )
    WITH CHECK (
        coalesce(
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
            FALSE
        )
    );

-- 5. Helpful index for triage performance
CREATE INDEX IF NOT EXISTS idx_verifier_applications_status ON public.verifier_applications(status);
CREATE INDEX IF NOT EXISTS idx_verifier_applications_submitted ON public.verifier_applications(submitted_at DESC);
