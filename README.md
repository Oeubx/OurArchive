# OurArchive (v1.0.0 Template)

> **Platform Scope & Zero-Download Notice**  
> **OurArchive** is a zero-download, read-only cloud drive directory and document streaming platform.
> 
> All indexed documents and creative works belong 100% to their original creators. The system operates on a strict **Read-Only / Zero-Download** principle: files are never stored or downloaded onto application servers. If any creator or Drive owner wishes to have their work or link removed, please contact the administrator, and it will be removed promptly.

---

## 1. Project Purpose

**OurArchive** provides a clean, searchable index and distraction-free online reader for shared cloud drive links:
- Users can submit public, view-only Google Drive links (individual files or curated folders).
- Readers can search and read indexed documents in a clean, distraction-free reader interface without downloading raw files.
- Automated safety filters and administrators verify submitted links to prevent malicious file distribution.
- Creators and Drive owners retain full sovereignty over their links with fast-track removal upon request.

---

## 2. Core Operational Principles

1. **Zero-Download / Ephemeral Read-Only**: The platform acts solely as an indexed directory. No files (`.pdf`, `.epub`, `.html`, Google Docs) are permanently hosted or downloaded onto application servers.
2. **Safety & Authenticity First**: Links pass through automated domain, MIME-type, and heuristic threat screening before entering the administrator verification queue.
3. **Frictionless Reading with Bot Defense**: Public reading and searching remain fast and open, protected by edge rate-limiting and anti-scraping safeguards.
4. **Immediate Takedown Guarantee**: Creators and Drive owners hold full rights. Any request for removal is fulfilled promptly by the system administrator.

---

## 3. Quick Start (Template Setup)

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase, Google Drive API, Cloudflare Turnstile, and contact settings.
3. **Apply database migrations:**
   Run the SQL migrations in `supabase/migrations/` against your Supabase project.
4. **Run locally:**
   ```bash
   pnpm dev
   ```

---

## 4. Documentation & Governance Structure

All system specifications, architecture diagrams, and backlogs are maintained under [`docs/`](docs/) using relative paths:

- **Disclaimers & Legal Notice**: [`docs/disclaimers/`](docs/disclaimers/README.md)
  - [Authors & Ownership Rights](docs/disclaimers/fanfic_authors_and_ownership.md)
  - [Drive Owners & Privacy Notice](docs/disclaimers/drive_owners_and_privacy.md)
  - [Copyright & Temporary Aid](docs/disclaimers/copyright_and_temporary_aid.md)
  - [Immediate Takedown & Removal Procedure](docs/disclaimers/takedown_and_removal_request.md)
- **Architecture**: [`docs/architecture/`](docs/architecture/)
- **Database Specifications**: [`docs/database/`](docs/database/)
- **Infrastructure Specifications**: [`docs/infrastructure/`](docs/infrastructure/)
- **Sprint Backlogs & Commit Reference**: [`docs/backlogs/`](docs/backlogs/)

---

## 5. Contact & Immediate Removal

To request immediate removal of a link or report a security issue:
- **Email:** `takedown@example.com` *(or configured `NEXT_PUBLIC_TAKEDOWN_EMAIL`)*
- **Procedure:** See the [Takedown & Removal Guide](docs/disclaimers/takedown_and_removal_request.md).
