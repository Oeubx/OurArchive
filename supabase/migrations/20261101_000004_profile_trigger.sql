-- =============================================================================
-- Migration: 20261101_000004_profile_trigger.sql
-- Description: User profile auto-provisioning trigger from auth.users
-- Specifications: docs/backlogs/module-1-auth-db/schema_and_rls_spec.md
-- Backlog Item: [OA-M1-F2]
-- =============================================================================

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
        COALESCE(NEW.raw_app_meta_data->>'role', 'user')
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
