# Changelog

All notable changes to **OurArchive** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Emergency Community Notice:** OurArchive is a temporary, non-commercial, zero-download reading directory built to keep fanworks accessible during primary archive disruptions. All creative works remain 100% the property of their original creators.

---

## [1.0.2] — 2026-11-14

Fanwork metadata intelligence update introducing deterministic first-page catalog scanning, granular multi-facet search filtering, and enriched upload categorization across all contributor and admin intake surfaces.

### Added
- **Deterministic First-Page Metadata Parser**: Platform-agnostic, non-AI regex engine (`src/lib/services/metadata-parser.ts`) extracting title, author, rating, categories, archive warnings, characters, relationships, word count, status, and language from fanwork document page 1. Includes automatic SFW/NSFW classification and plain-text fallback (`[OA-M2-F2]`).
- **Scan Metadata API Endpoint**: Ephemeral in-memory streaming endpoint at `/api/links/scan-metadata` for zero-storage, read-only page-1 metadata extraction (`[OA-M2-F2]`).
- **Multi-Facet Dynamic Filter Drawer**: Full filter UI in `SearchSection` with Category, Rating, Archive Warning, Completion Status, Character search, and Word Count range controls (`[OA-M2-F3]`).
- **Debounced Auto-Search**: 350ms debounced auto-search with `AbortController` cancellation to prevent database query congestion (`[OA-M2-F3]`).
- **Granular Card Metadata Display**: `DisplayCard` updated to render category pills, warning badges, character tags, and completion status indicators (`[OA-M2-F3]`).
- **Manual Metadata Scan in Upload Modals**: `Scan Metadata` button and granular categorization fields (category, warnings, characters, relationships, completion, language) added to contributor `UploadModal`, `AssistedIntakeModal`, and admin `AdminDirectUploadModal` with admin submit lock until scan is confirmed (`[OA-M2-F6]`).
- **Granular Fanwork Schema (`OA-M1-F4`)**: New columns `categories`, `characters`, `warnings`, `relationships`, `is_complete`, `language` on `public.link_metadata`; 4 GIN array indexes; updated `vw_public_search_feed` and `vw_admin_triage_feed`; collection folder purge cascades for takedown integrity.
- **Deterministic Catalog Scanning Disclosure**: Added scanning transparency subsection to `/disclaimers` and updated `docs/backlogs/module-2-drive-upload-search/drive_link_processing_spec.md` (`[OA-M3-F4]`).
- **Metadata Parser Unit Tests**: Automated test suite in `src/lib/services/__tests__/metadata-parser.test.ts` verifying catalog extraction and SFW/NSFW classification (`[OA-M2-F2]`).
- **3-Hour Takedown Review Grace Period & Header Banner**: Implemented a 3-hour review window (`takedown_flagged_at` and `takedown_deadline`) on `drive_links` with an active warning notice in the reader header, automatic timeout suppression if unreviewed within 3 hours, and timer cancellation upon administrator dismissal (`[OA-M3-F5]`).
- **Synchronized Reader Pagination & Direct Resumption**: Added scroll observation across `[data-pdf-page]` elements to dynamically synchronize `Pg [X]` counter during reading, with direct page jumping and bookmark resumption scrolling directly to the saved page element (`[OA-M2-F4]`).
- **Formatted Reader Typography Spacing**: Added `.reader-content p` typography spacing rules (`margin: 1.15em !important; line-height: 1.85 !important;`) in `globals.css` ensuring comfortable vertical separation across dialogue and paragraphs (`[OA-M2-F4]`).
- **Archive & EPUB Ingestion Exclusion**: Excluded `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.epub`, and compressed folder formats from folder scanning traversal, removing `application/epub+zip` from threat scanner allowlist (`[OA-M3-F1]`).

### Changed
- **UI Terminology & Jargon Cleanup**: Replaced technical database jargon ("Supabase") across user profile, search results, and reader tooltips with user-friendly terms ("Cloud Synced", "reading bookmarks", "library archive") (`[OA-M1-F2]`, `[OA-M2-F5]`).
- **Portal Hero Copy**: Removed external drive mirror redirection clause from portal homepage hero description (`[OA-M2-F5]`).

### Fixed
- **Static Reader Page Counter on Scroll**: Fixed an issue where the reader toolbar remained static at `Pg 1` when scrolling through multi-page native extracted HTML works (`[OA-M2-F4]`).
- **Bookmark Resume Scroll Bypass**: Fixed an issue where resuming a reading bookmark skipped scrolling if `isPdf: true` despite having extractable HTML text (`[OA-M2-F4]`).
- **Takedown Modal Scrollbar & Field Resizing**: Fixed unstyled bright white browser scrollbar in dark modal views and constrained Proof of Ownership textarea to a non-expandable 3-line scrollable box (`[OA-M3-F5]`).
- **Database View Recreation Error**: Added `DROP VIEW IF EXISTS CASCADE` for both search feed views in migration `20261114_000010` to resolve PostgreSQL error `42P16` during column additions (`[OA-M1-F4]`).

---

## [1.0.1] — 2026-11-13


Maintenance, safety, and community transparency patch refining card UI layouts, introducing SFW/NSFW classification and search filtering, clarifying AI usage policies, and providing dynamic profile submission tracking.

### Added
- **Registration Age Affirmation (18+)**: Mandatory 18+ checkbox on sign up recording `is_adult: true` into Supabase Auth user metadata and seeding local consent (`[OA-M1-F1]`).
- **SafeSearch Advisory Confirmation Gate**: Interstitial modal in `SearchSection` gating `[🔴 NSFW (18+)]` searches behind age affirmation (`[OA-M2-F3]`).
- **AO3-Style Reader Warning Interstitial**: Content advisory screen in `ReaderPage` requiring explicit confirmation before displaying mature or explicit fanworks (`[OA-M2-F4]`).
- **Adult Content Profile Preference**: Dedicated toggle in `/profile` allowing users to activate or deactivate adult content access across their device (`[OA-M1-F2]`).
- **SFW / NSFW Classification**: Prominent classification toggle (`🟢 SFW` vs `🔴 NSFW (18+)`) in `UploadModal` with automatic rating alignment, system tagging (`sfw` / `nsfw`), and recursive inheritance for collection folder children (`[OA-M2-F6]`).
- **SFW / NSFW Search Filters**: Interactive filter pills (`[All Works]`, `[🟢 SFW Only]`, `[🔴 NSFW (18+)]`) in `SearchSection` with backend query integration in `/api/search` (`[OA-M2-F3]`).
- **Folder Limits & Pathing Guide**: Interactive info guide view in `UploadModal` detailing system ingestion limits (4 nesting depth, 30 subfolders, 100 readable files) with visual hierarchy pathing (`[OA-M2-F6]`).
- **AI Policy & Transparency Disclaimer**: Added Pillar 6 to `/disclaimers` detailing human-led development by `Oeubx`, Gemini 3.8 Flash assistance via Google Antigravity, zero runtime AI, zero story reading, and rule-based MIME safety checks (`[OA-M3-F4]`).
- **Project Repository Link**: Added `NEXT_PUBLIC_PROJECT_REPO` and direct GitHub repository hyperlink in global footer "Reach Out & Connect" section (`[OA-M0-F0]`).

### Changed
- **Terminology Rebranding**: Systematically replaced "Emergency Service" with "TEMPORARY PROJECT" across Homepage hero pill, global notice banner, footer, and community disclaimers (`[OA-M3-F4]`).

### Fixed
- **Profile Submission Count Drift**: Replaced static database seed counter with `getLiveSubmissionMetrics()` to calculate authentic submissions and indexed works directly from `drive_links` (`[OA-M1-F2]`).

### Refactored
- **Card Header Projection**: Removed legacy `SYSTEM HEADER` bar UI from `DisplayCard` and `SkeletonCard`, relocating format indicator pills adjacent to rating badges in the title row (`[OA-M2-F5]`).

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
