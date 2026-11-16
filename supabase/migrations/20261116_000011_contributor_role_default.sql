-- =============================================================================
-- Migration: 20261116_000011_contributor_role_default.sql
-- Description: Aligns default registered user role to 'contributor' in schema,
--              migrates legacy 'user' rows safely, and updates auto-provisioning.
-- Backlog Items: [OA-M1-F2], [OA-M3-F3]
-- =============================================================================

-- 1. Ensure role check constraint accommodates contributor, verifier, admin, and legacy user
ALTER TABLE public.user_profiles 
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('user', 'contributor', 'verifier', 'admin'));

-- 2. Alter column default on user_profiles from 'user' to 'contributor'
ALTER TABLE public.user_profiles 
    ALTER COLUMN role SET DEFAULT 'contributor';

-- 3. Temporarily bypass anti-elevation trigger for administrative data migration
ALTER TABLE public.user_profiles DISABLE TRIGGER trg_protect_user_roles;

-- Migrate any existing legacy 'user' records to 'contributor'
UPDATE public.user_profiles 
SET role = 'contributor', updated_at = timezone('utc'::text, now())
WHERE role = 'user';

-- Re-enable anti-elevation trigger
ALTER TABLE public.user_profiles ENABLE TRIGGER trg_protect_user_roles;

-- 4. Update the anti-elevation guard function to recognize postgres and supabase superusers
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
  
  -- Check if executed via internal service_role, postgres superuser, or supabase_admin
  v_is_service_role := (
    current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin')
    OR current_user IN ('postgres', 'supabase_admin')
  );

  -- If the role is being altered
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only permit if caller is verified admin or service_role/superuser
    IF (v_jwt_role <> 'admin' AND NOT v_is_service_role) THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Only administrators can modify user role assignments. Attempted transition: % -> %',
        OLD.role, NEW.role
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Update the profile auto-provisioning trigger to default new accounts to 'contributor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'user_name',
            split_part(NEW.email, '@', 1),
            'Anonymous Archivist'
        ),
        COALESCE(NEW.raw_app_meta_data->>'role', 'contributor')
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
