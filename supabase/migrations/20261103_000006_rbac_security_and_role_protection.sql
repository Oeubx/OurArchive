-- ==============================================================================
-- Migration: 20261103_000006_rbac_security_and_role_protection.sql
-- Description: Enforces anti-tampering role elevation protection, verifier
--              application triage security, and immutable audit logging.
-- Run in: Supabase Dashboard SQL Editor
-- ==============================================================================

-- 1. Anti-Tampering Trigger Function for User Roles
-- Ensures that no client or compromised account can elevate their own role
-- unless the executing JWT contains the 'admin' app_metadata role or service_role.

CREATE OR REPLACE FUNCTION public.fn_prevent_unauthorized_role_elevation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jwt_role TEXT;
  v_is_service_role BOOLEAN;
BEGIN
  -- Extract caller JWT role from auth.jwt()
  v_jwt_role := COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  );
  
  -- Check if executed via internal service_role
  v_is_service_role := (current_setting('role', true) = 'service_role');

  -- If the role is being altered
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only permit if caller is verified admin or service_role
    IF (v_jwt_role <> 'admin' AND NOT v_is_service_role) THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Only administrators can modify user role assignments. Attempted transition: % -> %',
        OLD.role, NEW.role
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists and attach trigger to user_profiles
DROP TRIGGER IF EXISTS trg_protect_user_roles ON public.user_profiles;
CREATE TRIGGER trg_protect_user_roles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_unauthorized_role_elevation();


-- 2. Enhanced RLS for user_profiles Table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified archivist profiles
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
CREATE POLICY "Public can view user profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to update ONLY their own profile data (name, avatar)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- 3. Enhanced RLS for verifier_applications Table
ALTER TABLE public.verifier_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own application
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.verifier_applications;
CREATE POLICY "Applicants can view own applications"
  ON public.verifier_applications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Authenticated users can submit applications
DROP POLICY IF EXISTS "Users can submit verifier applications" ON public.verifier_applications;
CREATE POLICY "Users can submit verifier applications"
  ON public.verifier_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only Admins can review/update application status
DROP POLICY IF EXISTS "Only admins can review verifier applications" ON public.verifier_applications;
CREATE POLICY "Only admins can review verifier applications"
  ON public.verifier_applications
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );


-- 4. Immutable Action Audit Logs (admin_actions)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only Admins can read full audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_actions;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins and system processes can insert audit entries
DROP POLICY IF EXISTS "Admins can insert audit entries" ON public.admin_actions;
CREATE POLICY "Admins can insert audit entries"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Explicitly revoke UPDATE and DELETE to guarantee immutable records
REVOKE UPDATE, DELETE ON public.admin_actions FROM authenticated, anon, public;

COMMENT ON FUNCTION public.fn_prevent_unauthorized_role_elevation() IS
  'Guards user_profiles against self-role elevation and database manipulation.';
