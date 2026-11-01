# Module 1: Auth, Profiles & Database Architecture

> **Module Code:** `OA-M1`  
> **Scope:** Supabase Auth (Discord / Magic Link), User Profiles, Admin Role-Based Access Control (RBAC), and PostgreSQL Row-Level Security (RLS).

---

## 1. Module Overview

Module 1 establishes the identity and relational data layer for OurArchive:
1. **Authentication Providers**: Frictionless login via Discord OAuth and Email Magic Link.
2. **User Profiles & Contributor Tracking**: Identity mapping from `auth.users` to `public.user_profiles`, tracking submission counts and ban flags.
3. **Admin RBAC**: Custom JWT claims (`app_metadata.role = 'admin'`) for administrative route protection.
4. **PostgreSQL Relational Schema**: Normalized tables for `drive_links`, `link_metadata`, `link_verifications`, and `admin_actions`.
5. **Row-Level Security (RLS)**: Enforces that public readers only query verified, unhidden works while admins retain full operational control.

---

## 2. Features & Backlog Items

| Commit Code | Feature | Documentation File |
| :--- | :--- | :--- |
| `OA-M1-F0` | Auth & Database Maintenance | [`README.md`](README.md) |
| `OA-M1-F1` | Supabase Auth Integration | [`../../infrastructure/supabase_architecture.md`](../../infrastructure/supabase_architecture.md) |
| `OA-M1-F2` | User Profiles & Contributor Tracking | [`schema_and_rls_spec.md`](schema_and_rls_spec.md) |
| `OA-M1-F3` | Admin Role-Based Access Control | [`schema_and_rls_spec.md`](schema_and_rls_spec.md) |
| `OA-M1-F4` | PostgreSQL Schema & RLS Policies | [`../../database/schema_definition.md`](../../database/schema_definition.md) |

---

## 3. Related Specifications
- [Schema Definition & RLS Contracts](../../database/schema_definition.md)
- [Database Indexes & Performance](../../database/indexes_and_performance.md)
