# OurArchive

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).
> 
> All creative works and fanfiction belong 100% to their original creators. The system operates on a strict **Read-Only / Zero-Download** principle: files are never stored or downloaded onto OurArchive servers. If any author or Drive owner wishes to have their work or link removed, please contact the administrator, and it will be removed immediately.

---

## 1. Project Purpose

During extended or unexpected outages of Archive of Our Own (AO3), readers and authors lose access to bookmarked works, continuing stories, and community archives. **OurArchive** bridges this gap as a temporary, non-commercial community hub where:
- Users can submit public, view-only Google Drive links containing fanfiction backups.
- Readers can search and read works in a clean, distraction-free reader interface without downloading raw files.
- Internal automated safety filters and system administrators verify submitted links to prevent malicious file distribution.
- Authors and Drive owners have complete sovereignty over their links with zero-barrier immediate removal upon request.

---

## 2. Core Operational Principles

1. **Zero-Download / Ephemeral Read-Only**: The platform acts solely as an indexed directory. No fanfiction files (`.pdf`, `.epub`, `.html`, Google Docs) are permanently hosted or downloaded onto our servers.
2. **Safety & Authenticity First**: Links pass through automated domain, MIME-type, and heuristic threat screening before entering the administrator verification queue.
3. **Frictionless Reading with Bot Defense**: Public reading and searching remain 100% anonymous, fast, and open, while protected by edge rate-limiting and anti-scraping safeguards.
4. **Immediate Takedown Guarantee**: Fanfic authors and Drive owners hold full rights. Any request for removal will be fulfilled immediately by the system administrator.

---

## 3. Documentation & Governance Structure

All system specifications, architecture diagrams, and backlogs are maintained under [`docs/`](docs/) using strict relative paths:

- **Disclaimers & Legal Notice**: [`docs/disclaimers/`](docs/disclaimers/README.md)
  - [Fanfic Authors & Ownership Rights](docs/disclaimers/fanfic_authors_and_ownership.md)
  - [Drive Owners & Privacy Notice](docs/disclaimers/drive_owners_and_privacy.md)
  - [Copyright, Fair Use & AO3 Solidarity](docs/disclaimers/copyright_and_ao3_temporary_aid.md)
  - [Immediate Takedown & Removal Procedure](docs/disclaimers/takedown_and_removal_request.md)
- **Architecture**: [`docs/architecture/`](docs/architecture/) *(In Progress)*
- **Database Specifications**: [`docs/database/`](docs/database/) *(In Progress)*
- **Infrastructure Specifications**: [`docs/infrastructure/`](docs/infrastructure/) *(In Progress)*
- **Sprint Backlogs & Commit Reference**: [`docs/backlogs/`](docs/backlogs/) *(In Progress)*

---

## 4. Branching & Delivery Workflow

OurArchive follows a standardized branching model:
- `main`: Production and baseline documentation.
- `development`: Core integration branch.
- Feature/Doc branches: `docs/<type>-<scope>` or `<type>/<changes>` branched off `development` and merged via Pull Requests.

---

## 5. Contact & Immediate Removal

To request immediate removal of a link, report a security issue, or submit a view-only link via Assisted Admin Upload:
- **Email:** `takedown-ourarchive@proton.me` *(or configured admin channel)*
- **Procedure:** See the [Takedown & Removal Guide](docs/disclaimers/takedown_and_removal_request.md).
