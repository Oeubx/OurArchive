# OurArchive Version History & Release Alignment

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. Purpose

This directory tracks **version alignment**, **release milestones**, and **environment synchronization** across the OurArchive codebase, database migrations, and progressive delivery branches (`development` → `staging` → `production`).

For a detailed, Keep-a-Changelog list of added features and fixes per release, see [CHANGELOG.md](../../CHANGELOG.md).

---

## 2. Release Index

| Version | Release Date | Status | Delivery Path | Release Record |
| :--- | :--- | :--- | :--- | :--- |
| **`v1.0.0`** | 2026-11-12 | Production Release | `development` → `staging` → `production` | [v1.0.0.md](v1.0.0.md) |
| `v0.1.0` | Pre-Production | Superseded | Initial scaffold & `docs/*` | See [CHANGELOG.md](../../CHANGELOG.md) |

---

## 3. Active Version Alignment Matrix (`v1.0.0`)

All runtime, package, UI, and documentation surfaces must remain synchronized on the active release version:

| Surface | Location | Current Value | Source of Truth |
| :--- | :--- | :--- | :--- |
| **Package Manifest** | [`package.json`](../../package.json) | `1.0.0` | Release bump |
| **Runtime Config** | [`src/lib/config.ts`](../../src/lib/config.ts) | `APP_VERSION = "1.0.0"` | Shared constant |
| **Health Telemetry API** | [`src/app/api/health/route.ts`](../../src/app/api/health/route.ts) | `version: APP_VERSION` | `APP_VERSION` |
| **Homepage Hero Badge** | [`src/app/page.tsx`](../../src/app/page.tsx) | `v1.0.0` | `APP_VERSION` |
| **Global Footer Sub-Bar** | [`src/components/layout/Footer.tsx`](../../src/components/layout/Footer.tsx) | `v1.0.0` | `APP_VERSION` |
| **Changelog** | [`CHANGELOG.md`](../../CHANGELOG.md) | `[1.0.0] — 2026-11-12` | Release notes |

---

## 4. Release Checklist for Future Versions

When bumping to a new version (e.g., `v1.0.1` or `v1.1.0`):
1. Update `"version"` in `package.json` and `APP_VERSION` in `src/lib/config.ts`.
2. Add a new version section to `CHANGELOG.md`.
3. Create `docs/version_history/vX.Y.Z.md` and add it to the **Release Index** and **Active Version Alignment Matrix** in this file (`docs/version_history/README.md`).
4. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` on `development`.
5. Promote via PR: `development` → `staging` (verify locally & on preview) → `production`.
