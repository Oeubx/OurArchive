# OurArchive Sprint Backlogs — Commit Reference & Feature Catalog

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).

This document is the canonical commit and backlog reference for the **OurArchive** ecosystem across documentation, backend, and frontend delivery.

---

## 1. Commit Code Grammar

All commits touching OurArchive must adhere to Conventional Commits grammar and include the specialized system backlog code:

```text
<type>(<scope>): <concise description in past-tense> [OA-M#-F#]
```

### Examples:
- `feat(ingest): validate canonical drive urls with strict regex [OA-M2-F1]`
- `feat(admin): implement 6-action triage suite in review queue [OA-M3-F2]`
- `fix(auth): handle null discord avatar gracefully during user sync [OA-M1-F1]`
- `docs(backlog): compile module 2 drive processing specifications [OA-M2-F0]`

### Valid Commit Types:
- `feat`: A new feature, page, or user-facing capability.
- `fix`: A bug fix or patch for unexpected behavior.
- `docs`: Documentation-only updates.
- `refactor`: Code restructuring that neither fixes a bug nor adds a feature.
- `test`: Adding or modifying automated unit/integration tests.
- `chore`: Routine maintenance, updating dependencies, or `.gitignore` tweaks.
- `ci`: Changes to CI/CD workflows (`.github/workflows/*`).
- `perf`: Performance optimizations (e.g. database indexing, caching).
- `style`: Formatting, whitespace, or linting adjustments with no logic changes.
- `revert`: Reverting a previous commit.

---

## 2. Module Legend

| Module Code | Module / Area | Primary Scope | Directory Link |
| :--- | :--- | :--- | :--- |
| **M0** | Infrastructure & Cloud Deployment | Vercel serverless, Edge middleware, CI/CD gates, environment matrix | [module-0-infrastructure/](module-0-infrastructure/README.md) |
| **M1** | Auth, Profiles & Database Architecture | Supabase Auth, PostgreSQL DDL, RLS security policies, Admin RBAC | [module-1-auth-db/](module-1-auth-db/README.md) |
| **M2** | Drive Upload, Reading & Searching | Canonical URL parsing, view-only checks, full-text search, reader sandbox | [module-2-drive-upload-search/](module-2-drive-upload-search/README.md) |
| **M3** | Verification, Safety & Disclaimers | 2-tier automated scanner, Admin 6-action suite, disclaimers, takedown | [module-3-verification-safety/](module-3-verification-safety/README.md) |

---

## 3. Feature Code Index

### MODULE 0: Infrastructure & Cloud Deployment (`OA-M0-F#`)
- Specification: [module-0-infrastructure/README.md](module-0-infrastructure/README.md)

| Commit Code | Feature Name | Description | Specification Link |
| :--- | :--- | :--- | :--- |
| `OA-M0-F0` | Repository Governance & CI/CD Gate | Setup `.gitignore`, GitHub Actions CI workflow, and relative path audits | [module-0-infrastructure/README.md](module-0-infrastructure/README.md) |
| `OA-M0-F1` | Vercel Hosting & Edge Routing | Serverless Next.js topology, edge rate-limiting middleware, and env secrets | [../infrastructure/hosting_and_deployment.md](../infrastructure/hosting_and_deployment.md) |
| `OA-M0-F2` | Supabase BaaS Initialization | Supabase project bootstrap, connection pooling, and idempotent migrations | [../infrastructure/supabase_architecture.md](../infrastructure/supabase_architecture.md) |
| `OA-M0-F3` | Health Checks & Error Telemetry | Endpoint health monitoring and edge function timeout protections | [module-0-infrastructure/README.md](module-0-infrastructure/README.md) |

---

### MODULE 1: Auth, Profiles & Database Architecture (`OA-M1-F#`)
- Specification: [module-1-auth-db/README.md](module-1-auth-db/README.md)

| Commit Code | Feature Name | Description | Specification Link |
| :--- | :--- | :--- | :--- |
| `OA-M1-F0` | Auth & Database Maintenance | Schema governance, migration script tracking, and dependency maintenance | [module-1-auth-db/README.md](module-1-auth-db/README.md) |
| `OA-M1-F1` | Supabase Auth Integration | Frictionless sign-in via Discord OAuth and Email Magic Links | [../infrastructure/supabase_architecture.md](../infrastructure/supabase_architecture.md) |
| `OA-M1-F2` | User Profiles & Contributor Tracking | Profile synchronization, submission count tracking, and ban flags | [module-1-auth-db/schema_and_rls_spec.md](module-1-auth-db/schema_and_rls_spec.md) |
| `OA-M1-F3` | Admin Role-Based Access Control | Custom JWT claims for `admin` role and admin route gating | [module-1-auth-db/schema_and_rls_spec.md](module-1-auth-db/schema_and_rls_spec.md) |
| `OA-M1-F4` | PostgreSQL Schema & RLS Policies | DDL tables (`drive_links`, `link_metadata`, `admin_actions`) and RLS rules | [../database/schema_definition.md](../database/schema_definition.md) |

---

### MODULE 2: Drive Upload, Reading & Searching (`OA-M2-F#`)
- Specification: [module-2-drive-upload-search/README.md](module-2-drive-upload-search/README.md)

| Commit Code | Feature Name | Description | Specification Link |
| :--- | :--- | :--- | :--- |
| `OA-M2-F0` | Ingestion & Search Maintenance | Search index maintenance and ingestion pipeline updates | [module-2-drive-upload-search/README.md](module-2-drive-upload-search/README.md) |
| `OA-M2-F1` | Canonical Drive Link Ingestion | Strict regex validation for Google Drive URLs and view-only permissions | [module-2-drive-upload-search/drive_link_processing_spec.md](module-2-drive-upload-search/drive_link_processing_spec.md) |
| `OA-M2-F2` | Fanfiction Metadata Extraction | Title, fandom, pairing, rating, word count, and Drive owner extraction | [module-2-drive-upload-search/drive_link_processing_spec.md](module-2-drive-upload-search/drive_link_processing_spec.md) |
| `OA-M2-F3` | Full-Text & Multi-Tag Search | PostgreSQL `tsvector` weighted search and GIN index for tag arrays | [../database/indexes_and_performance.md](../database/indexes_and_performance.md) |
| `OA-M2-F4` | Distraction-Free Reader Mode | Ephemeral view-only text rendering with DOMPurify sanitization | [../architecture/reader_and_anti_bot_protection.md](../architecture/reader_and_anti_bot_protection.md) |
| `OA-M2-F5` | Standard Display Card Projection | Layout: `SYSTEM HEADER` -> `{displayed file}` + `{file details & hide}` | [../database/search_and_display_projection.md](../database/search_and_display_projection.md) |
| `OA-M2-F6` | Dual-Path Upload Model | Self-service authenticated upload alongside Assisted Admin Upload intake | [../architecture/drive_ingestion_and_search.md](../architecture/drive_ingestion_and_search.md) |

---

### MODULE 3: Verification, Safety & Disclaimers (`OA-M3-F#`)
- Specification: [module-3-verification-safety/README.md](module-3-verification-safety/README.md)

| Commit Code | Feature Name | Description | Specification Link |
| :--- | :--- | :--- | :--- |
| `OA-M3-F0` | Trust & Safety Maintenance | Security heuristics tuning, allowlist updates, and scanner maintenance | [module-3-verification-safety/README.md](module-3-verification-safety/README.md) |
| `OA-M3-F1` | 2-Tier Automated Threat Scanner | Metadata MIME allowlist, Google Safe Browsing API, and risk scoring | [module-3-verification-safety/verification_lifecycle_spec.md](module-3-verification-safety/verification_lifecycle_spec.md) |
| `OA-M3-F2` | Administrator 6-Action Suite | Review queue actions: **VERIFY**, **APPROVE**, **REJECT**, **HIDE**, **CONTACT**, **REMOVE** | [module-3-verification-safety/verification_lifecycle_spec.md](module-3-verification-safety/verification_lifecycle_spec.md) |
| `OA-M3-F3` | Quarantine & Flagging State Machine | Automatic threat quarantine and status transition state machine | [module-3-verification-safety/verification_lifecycle_spec.md](module-3-verification-safety/verification_lifecycle_spec.md) |
| `OA-M3-F4` | Community Disclaimers & Legal Notice | Creator rights, fair use, and solidarity with AO3 / OTW | [../disclaimers/README.md](../disclaimers/README.md) |
| `OA-M3-F5` | Immediate Takedown Protocol | Fast-track removal policy ("reach out and it is removed immediately") | [../disclaimers/takedown_and_removal_request.md](../disclaimers/takedown_and_removal_request.md) |
| `OA-M3-F6` | Reader Anti-Bot Defense | Edge rate limiting, Cloudflare Turnstile, and masked Drive reveal modal | [../architecture/reader_and_anti_bot_protection.md](../architecture/reader_and_anti_bot_protection.md) |
