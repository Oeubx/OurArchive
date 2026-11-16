-- =============================================================================
-- Migration: 20261116_000011_contributor_role_default.sql
-- Description: Aligns default registered user role to 'contributor' in schema,
--              migrates legacy 'user' rows, and updates auto-provisioning trigger.
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

-- 3. Migrate any existing legacy 'user' records to 'contributor'
UPDATE public.user_profiles 
SET role = 'contributor', updated_at = timezone('utc'::text, now())
WHERE role = 'user';

-- 4. Update the profile auto-provisioning trigger to default new accounts to 'contributor'
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
