# Module 1 Specification: Profiles, RBAC & RLS Architecture

> **Module:** Module 1 — Auth, Profiles & Database Architecture  
> **Commit Codes:** `OA-M1-F2`, `OA-M1-F3`, `OA-M1-F4`

---

## 1. User Profile Lifecycle & Auto-Provisioning

When a user authenticates via Discord OAuth or Magic Link, Supabase fires an automated trigger (`on_auth_user_created`) to synchronize a corresponding profile:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'custom_claims', NEW.raw_user_meta_data->>'full_name', 'Anonymous Archivist'),
        COALESCE(NEW.raw_app_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Role-Based Access Control (RBAC) Matrix

| Capability | Anonymous Reader | Contributor (`user`) | Administrator (`admin`) |
| :--- | :---: | :---: | :---: |
| Browse Verified Works | ✅ | ✅ | ✅ |
| Read Stories in Sandbox | ✅ | ✅ | ✅ |
| Reveal Drive Link / Path | ✅ (Rate Limited) | ✅ | ✅ |
| Submit View-Only Drive Links | ❌ (Must use Assisted Intake) | ✅ (Up to 5/hr) | ✅ (Unlimited) |
| Hide / Edit Own Submissions | ❌ | ✅ | ✅ |
| Access Admin Triage Queue | ❌ | ❌ | ✅ |
| Execute 6-Action Suite | ❌ | ❌ | ✅ |
| Permanent Purge (Takedown) | ❌ | ❌ | ✅ |

---

## 3. Strict Row-Level Security Rules

All tables enforce PostgreSQL RLS policies ensuring that:
1. Unverified or flagged submissions cannot be queried through the public API.
2. Contributor updates are restricted to rows where `auth.uid() = uploader_user_id`.
3. The Admin service role or authenticated admin accounts have unconditional access for queue triage.

Detailed SQL DDL is maintained in [`../../database/schema_definition.md`](../../database/schema_definition.md).
