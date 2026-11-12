-- =============================================================================
-- Migration: 20261101_000001_core_schema.sql
-- Description: Core relational schema for OurArchive
-- Specifications: docs/database/schema_definition.md
-- Backlog Item: [OA-M1-F4]
-- =============================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: user_profiles
-- Maps to Supabase auth.users via foreign key
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' 
        CHECK (role IN ('user', 'contributor', 'admin')),
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    submission_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. Table: drive_links
-- Master link record enforcing Read-Only / Zero-Download principle
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3. Table: link_metadata
-- Descriptive attributes and Drive file metadata
-- -----------------------------------------------------------------------------
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
    canonical_source_url TEXT,
    
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

-- -----------------------------------------------------------------------------
-- 4. Table: link_verifications
-- Security scan metrics and administrative review status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.link_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.drive_links(id) ON DELETE CASCADE,
    automated_risk_score INTEGER NOT NULL DEFAULT 0 
        CHECK (automated_risk_score BETWEEN 0 AND 100),
    automated_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
    scanner_passed BOOLEAN NOT NULL DEFAULT FALSE,
    admin_verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    admin_verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    verification_badge VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 5. Table: admin_actions
-- Immutable audit log for administrative triage actions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.drive_links(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    action_type VARCHAR(30) NOT NULL 
        CHECK (action_type IN ('VERIFY', 'APPROVE', 'REJECT', 'HIDE', 'UNHIDE', 'CONTACT', 'REMOVE')),
    reason TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
