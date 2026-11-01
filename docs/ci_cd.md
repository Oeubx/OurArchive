# OurArchive CI/CD & Delivery Architecture

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).

---

## 1. Overview & Pipeline Philosophy

The Continuous Integration and Continuous Delivery (CI/CD) system for OurArchive is designed for rapid, secure, and reproducible deployments while preventing regressions, broken links, or unauthorized modifications during emergency operations.

All automated pipelines are hosted via **GitHub Actions** and deploy preview and production builds to **Vercel** with database state managed in **Supabase**.

---

## 2. Dual-Tier Verification Strategy

Adapted from the enterprise testing standard of `TRACE_Backend`, OurArchive employs a dual-tier verification pipeline to optimize developer feedback speed without compromising release reliability:

```mermaid
flowchart TD
    subgraph Tier1["Tier 1: Fast Feature Checks (PRs to development)"]
        A[Push or PR Event] --> B[Checkout & Setup Node.js]
        B --> C[Markdown Relative Link Validation]
        C --> D[Absolute Path Audit - Block C:/]
        D --> E[TypeScript Typecheck & ESLint]
        E --> F[Unit & Component Tests]
    end

    subgraph Tier2["Tier 2: Full Promotion Gate (PRs to staging / main)"]
        G[Promotion PR Event] --> H[Enforce Branch Flow Rules]
        H --> I[Vercel Preview Build Verification]
        I --> J[Supabase Migration & Schema Audit]
        J --> K[End-to-End Search & Reader Smoke Tests]
        K --> L[Publish to Production on Merge]
    end

    Tier1 -->|PR Approved & Merged| Tier2
```

### Tier 1: Fast Development Checks
- **Trigger**: Every push and Pull Request targeting `development`.
- **Target Execution Time**: Under 3 minutes.
- **Jobs**:
  1. **Documentation Link Integrity**: Parses all Markdown files to verify relative file paths and validate that internal links point to existing files.
  2. **Absolute Path Shield**: Greps the repository for hardcoded Windows (`C:\`, `D:\`) or local user directories to ensure zero-defect portability.
  3. **Code Syntax & Static Analysis**: Runs TypeScript type-checking (`tsc --noEmit`) and ESLint.

### Tier 2: Full Promotion Regression Gate
- **Trigger**: Pull Requests targeting `staging` or `main`.
- **Jobs**:
  1. **Branch Flow Enforcement**:
     - PRs to `staging` **must** originate from `development`.
     - PRs to `main` **must** originate from `staging` (or emergency hotfixes from `development`).
     - Directly merging unverified feature branches into `main` fails immediately.
  2. **Vercel Build Simulation**: Verifies that Next.js edge builds compile without missing environment variables or bundler failures.
  3. **Database Migration Synchronization**: Verifies that SQL migration scripts in `db/migrations/` match Supabase production schemas.

---

## 3. GitHub Actions Workflows

The repository uses the following GitHub Actions workflows under [`.github/workflows/`](../.github/workflows/):

### 1. `ci.yml` (Core CI Gate)
- Enforces branch flow validation.
- Audits documentation for hardcoded absolute paths.
- Validates internal relative markdown link integrity.

### 2. `sync-prs.yml` (Stakeholder Tracking - Optional Integration)
- Adapted from the TRACE ecosystem: uses `actions/github-script@v7` on PR lifecycle events (`opened`, `synchronize`, `closed`, `merged`).
- Parses commit/PR backlog tags formatted as `[OA-M#-F#]`.
- Dispatches event payloads to a Google Apps Script webhook to maintain live development dashboards.

---

## 4. Branching Strategy & Delivery Matrix

| Branch | Role | Direct Push Allowed? | Required PR Base | Deployment Target |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | Production Release | Only for Phase 0 bootstrap | `staging` | Vercel Production (`ourarchive.org` / live domain) |
| **`staging`** | Integration Testing | No | `development` | Vercel Staging (`staging.ourarchive...`) |
| **`development`** | Active Development | No | Feature branch | Vercel Preview |
| **`docs/*` / `<type>/<changes>`** | Feature & Spec Work | Yes (feature branch only) | `development` | Local / Ephemeral branch preview |

---

## 5. Environment Secrets & Access Control

The following secrets are managed in GitHub Repository Settings (`Settings -> Secrets and variables -> Actions`):

| Secret Name | Purpose | Scope |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Token for Vercel CLI deployments | Build & Deploy |
| `VERCEL_ORG_ID` | Vercel Organization ID | Deployment Routing |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Deployment Routing |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Gateway URL | Frontend & CI Integration |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous Supabase key | Frontend & CI Integration |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative service key | Backend Edge Functions |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Key for automated malware link checks | Internal Threat Scanner |

---

## 6. Developer Guidelines & Skill Integration

When working on OurArchive features:
1. Always use `.agents/skills/git-commits/SKILL.md` to format commits with Conventional Commits and `[OA-M#-F#]` tags.
2. Always use `.agents/skills/github-pr/SKILL.md` to manage branch creation off `development` and automate PR drafting.
3. Keep all documentation links relative to ensure portability across local clones and production documentation hosts.
