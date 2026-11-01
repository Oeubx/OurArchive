# Database Schema Definition & DDL Contracts

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).

---

## 1. Schema Overview

The OurArchive PostgreSQL schema is structured around five core tables:
1. `user_profiles`: Contributor identity, role-based access control (`user`, `contributor`, `admin`), and rate-limiting flags.
2. `drive_links`: Master link ingestion record, holding the sanitized Google Drive URL, verification state, and visibility flags.
3. `link_metadata`: Fanfiction and Google Drive file descriptors (title, author, fandom, summary, tags, owner info).
4. `link_verifications`: Automated security scan metrics (risk score, MIME validation) and admin verification timestamps.
5. `admin_actions`: Immutable audit trail for all admin operations (**VERIFY**, **APPROVE**, **REJECT**, **HIDE**, **CONTACT**, **REMOVE**).

---

## 2. DDL Table Specifications

### 2.1 Table: `user_profiles`
Maps directly to Supabase `auth.users` via foreign key relationship.

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'contributor', 'admin')),
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    submission_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 2.2 Table: `drive_links`
The core directory table. Strictly enforces the **Read-Only / Zero-Download** principle by storing only link pointers and access state.

```sql
CREATE TABLE IF NOT EXISTS public.drive_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_url TEXT NOT NULL UNIQUE,
    google_file_id VARCHAR(128) NOT NULL,
    upload_mode VARCHAR(30) NOT NULL DEFAULT 'authenticated' 
        CHECK (upload_mode IN ('authenticated', 'assisted_admin')),
    uploader_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending_scan'
        CHECK (verification_status IN ('pending_scan', 'pending_review', 'verified', 'rejected', 'flagged')),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_removed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 2.3 Table: `link_metadata`
Stores the descriptive fanfiction attributes and Google Drive public file details.

```sql
CREATE TABLE IF NOT EXISTS public.link_metadata (
    link_id UUID PRIMARY KEY REFERENCES public.drive_links(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL DEFAULT 'Unknown / Community Backup',
    fandom VARCHAR(255) NOT NULL,
    pairing VARCHAR(255),
    rating VARCHAR(50) DEFAULT 'Not Rated',
    word_count INTEGER DEFAULT 0,
    summary TEXT,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    canonical_ao3_url TEXT,
    
    -- Drive file descriptors
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    drive_owner_name VARCHAR(255),
    drive_owner_email VARCHAR(255),
    is_owner_masked BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 2.4 Table: `link_verifications`
Persists the results of the internal automated safety scanner and human admin verification.

```sql
CREATE TABLE IF NOT EXISTS public.link_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.drive_links(id) ON DELETE CASCADE,
    automated_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (automated_risk_score BETWEEN 0 AND 100),
    automated_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
    scanner_passed BOOLEAN NOT NULL DEFAULT FALSE,
    admin_verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    admin_verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    verification_badge VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 2.5 Table: `admin_actions`
Immutable audit log recording every administrative decision on uploaded links.

```sql
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.drive_links(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    action_type VARCHAR(30) NOT NULL 
        CHECK (action_type IN ('VERIFY', 'APPROVE', 'REJECT', 'HIDE', 'UNHIDE', 'CONTACT', 'REMOVE')),
    reason TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 3. Row-Level Security (RLS) Policies

All tables enforce Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

### 3.1 Public Reader Policy
Public readers (anonymous or authenticated) can query works only if the link is verified, unhidden, and not removed:

```sql
CREATE POLICY "Public readers can view verified active works"
ON public.drive_links
FOR SELECT
TO anon, authenticated
USING (
    verification_status = 'verified' 
    AND is_hidden = FALSE 
    AND is_removed = FALSE
);
```

### 3.2 Administrator Override Policy
Admins have full visibility and write access across all records:

```sql
CREATE POLICY "Admins have full access to drive_links"
ON public.drive_links
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
);
```

### 3.3 Contributor Submission Policy
Authenticated non-banned users can insert new links:

```sql
CREATE POLICY "Authenticated users can submit links"
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
```
