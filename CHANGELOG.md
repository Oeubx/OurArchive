# Changelog

All notable changes to **OurArchive** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Emergency Community Notice:** OurArchive is a temporary, non-commercial, zero-download reading directory built to keep fanworks accessible during primary archive disruptions. All creative works remain 100% the property of their original creators.

---

## [1.0.0] — 2026-11-12

Initial production release of **OurArchive**, promoting the complete progressive delivery baseline from `staging` to `production` across Modules **M0–M3** and staging stabilization fixes.

### Added

#### Module 0: Infrastructure, Telemetry & Progressive Delivery (`OA-M0`)
- **Application Scaffold**: Next.js 14 App Router, TypeScript, Tailwind CSS (tree-trunk brown palette with light/dark/warm theme support), and `pnpm` workspace configuration.
- **Hosting & Edge Protection**: Vercel serverless configuration (`vercel.json`) and Edge middleware (`src/middleware.ts`) with rate limiting and security headers.
- **Health Telemetry**: `/api/health` endpoint (`src/app/api/health/route.ts`) probing Supabase Auth health and reporting `version: "1.0.0"`.
- **CI/CD Gate**: GitHub Actions workflow (`.github/workflows/ci.yml`) enforcing branch flow (`development -> staging -> production`), relative Markdown link integrity, absolute-path blocking, TypeScript typechecking, and ESLint.

#### Module 1: Authentication, Profiles, RBAC & Database (`OA-M1`)
- **Authentication Flows**: Email/password sign-up & sign-in, OAuth callback handling, email verification, password visibility toggle, and community disclaimer interstitial (`src/components/auth/AuthModal.tsx`).
- **Role-Based Access Control (RBAC)**: Multi-role hierarchy (`reader`, `contributor`, `verifier`, `admin`) with server-side JWT/profile claim checks, `/admin` and `/manage` route guards, and anti-role-elevation database triggers.
- **PostgreSQL Schema & Migrations**: Nine sequential Supabase migrations (`supabase/migrations/20261101_000001_core_schema.sql` through `20261112_000009_audit_tombstones_takedowns_bookmarks_and_rebrand.sql`) establishing `drive_links`, `profiles`, `verifier_applications`, `audit_logs`, `feedback`, `takedowns`, `bookmarks`, and `tombstones` with Row-Level Security (RLS) policies and GIN full-text search indexes.
- **User Profile & Feedback**: `/profile` page for account/contributor details and `/feedback` signed-in community feedback portal (`src/app/api/feedback/route.ts`).

#### Module 2: Google Drive Ingestion, Search & Distraction-Free Reader (`OA-M2`)
- **Drive Link Validation & Upload**: Canonical Google Drive URL parser/validator (`src/lib/services/drive-validator.ts`), segmented link input (`src/lib/urlSegmenter.ts`), authenticated contributor upload (`/contribute`, `/api/links/submit`), and assisted public intake (`/api/assisted-intake`, `AssistedIntakeModal`).
- **Search & Discovery**: `/search` route and `/api/search` full-text query endpoint with `DisplayCard` grid, configurable page sizes, skeleton loading states, and masked Drive URL reveal modal (`/api/links/reveal`).
- **Distraction-Free Ephemeral Reader**: `/reader/[id]` and `/api/reader/[id]` zero-download streaming sandbox featuring:
  - In-memory Drive PDF-to-HTML conversion via `unpdf` with coordinate-aware spacing and zero-dependency HTML sanitization (`src/lib/utils/sanitize-html.ts`).
  - 3-way view mode switcher and synchronized light, warm (sepia), and dark reader themes with flash-free initial theme script (`src/app/layout.tsx`).
  - Recursive Google Drive subfolder discovery and collection Table of Contents for multi-part works.
  - Masked reader URL IDs (`src/lib/utils/idMasker.ts`).
  - Supabase-backed reading progress bookmarks and PDF checkpoints (`/api/bookmarks`).

#### Module 3: Verification, Safety, Audit, Takedowns & Compliance (`OA-M3`)
- **Two-Tier Threat Scanner & Quarantine**: Automated link & content safety scanner (`src/lib/security/threat-scanner.ts`) and quarantine state machine (`src/lib/security/state-machine.ts`) integrated into submission and inspection flows.
- **Admin & Verifier Triage Suite**: `/manage` and `/admin` dashboards with 6-action triage execution (`/api/admin/actions`), pre-approval `LinkInspectionModal`, `VerifierRequestsModal`, mobile-responsive card layout, and Supabase Realtime live updates (`useRealtimeDriveLinks`).
- **Audit Trail & Tombstones**: Persistent purge tombstones and lifecycle audit history (`/api/admin/audit`) with CSV/PDF export.
- **Immediate Takedown Protocol**: Zero-barrier `/takedown` portal (`/api/takedown`, `/api/admin/takedowns`) supporting authenticated Supabase takedown queues with ownership proof, prefilled reader takedowns, screenshot guidance, and direct email copy modal (`DirectTakedownEmailModal`) with 24-hour SLA copy.
- **Community Governance & Disclaimers**: `/disclaimers`, `/about-developer`, global `EmergencyNoticeBanner`, and static `v1.0.0` version indicator across `/api/health`, homepage hero, and footer.

### Documentation
- Added [CHANGELOG.md](CHANGELOG.md) and linked it from [docs/README.md](docs/README.md).
- Completed architecture, database, infrastructure, disclaimer, and backlog documentation under [docs/](docs/README.md).
