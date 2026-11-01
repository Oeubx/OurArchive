# Module 0: Infrastructure & Cloud Deployment

> **Module Code:** `OA-M0`  
> **Scope:** Cloud hosting topology, Vercel serverless functions, Edge Middleware, Supabase BaaS bootstrap, and GitHub Actions CI/CD automation.

---

## 1. Module Overview

Module 0 owns the foundation of the OurArchive platform:
1. **Serverless Hosting & Edge Routing**: Vercel configuration (`vercel.json`), Next.js App Router, edge middleware rate-limiting.
2. **Backend-as-a-Service (BaaS)**: Supabase project initialization, PostgreSQL engine, connection pooling (PgBouncer).
3. **Repository Shielding & CI/CD**: GitHub Actions workflows, markdown link validation, and absolute path shields.
4. **Environment Secret Governance**: Secure injection of Supabase service keys, Google Drive API credentials, and Safe Browsing keys.

---

## 2. Features & Backlog Items

| Commit Code | Feature | Documentation File |
| :--- | :--- | :--- |
| `OA-M0-F0` | Governance, CI/CD & Path Audit | [`../../ci_cd.md`](../../ci_cd.md) |
| `OA-M0-F1` | Vercel Hosting & Edge Routing | [`../../infrastructure/hosting_and_deployment.md`](../../infrastructure/hosting_and_deployment.md) |
| `OA-M0-F2` | Supabase BaaS Initialization | [`../../infrastructure/supabase_architecture.md`](../../infrastructure/supabase_architecture.md) |
| `OA-M0-F3` | Health Checks & Telemetry | [`../../infrastructure/hosting_and_deployment.md`](../../infrastructure/hosting_and_deployment.md) |

---

## 3. Implementation Verification Checklist
- [x] Base `.gitignore` shielding environment secrets.
- [x] GitHub Actions workflow enforcing branch flow rules and relative link checks.
- [x] Edge middleware rate limiting configured (60 search req/min, 10 reveal req/min).
