# System Architecture & Operational Overview

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. System Mission & Usage Model

OurArchive provides a non-commercial, resilient emergency bridge for the fanfiction community when primary fanwork archives suffer temporary service downtime.

### Core Architectural Axiom: Zero-Download / Read-Only
The platform operates exclusively as an index and streaming reader proxy:
- **No Physical File Storage**: The system never downloads, hosts, or duplicates fanfiction files (`.pdf`, `.epub`, `.html`, Google Docs) on server storage.
- **Ephemeral Read-Only Access**: Document text is retrieved on-demand directly from the author's public view-only Google Drive link and rendered in a clean reader view.
- **Immediate Takedown Sovereignty**: If an author or Drive owner requests removal, the link is permanently purged immediately (see [Takedown Policy](../disclaimers/takedown_and_removal_request.md)).

---

## 2. System Actors

| Actor | Role & Capabilities | Authentication Level |
| :--- | :--- | :--- |
| **Public Reader** | Searches works by fandom, author, or tags; reads in view-only mode; reveals Drive links on demand. | Anonymous / Public (Protected by bot defense) |
| **Contributor (Uploader)** | Submits public view-only Google Drive links, fills metadata tags, and tracks submission status. | Authenticated via Supabase Auth (Discord / Magic Link) |
| **Unauthenticated Submitter** | Submits links directly to the Administrator via the Assisted Admin Upload channel. | Anonymous (Admin verifies and uploads on behalf) |
| **Automated Safety Scanner** | Internal background scanner verifying canonical Drive URLs, MIME types, scripts, and domain safety. | System Service / Edge Function |
| **System Administrator** | Triages submitted links with the 6-Action Suite: **VERIFY**, **APPROVE**, **REJECT**, **HIDE**, **CONTACT**, **REMOVE**. | Authenticated (Role: `admin`) |

---

## 3. High-Level Component Topology

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Next.js on Vercel)"]
        UI_Search["Public Search & Feed UI"]
        UI_Reader["Distraction-Free Reader View"]
        UI_Upload["Contributor Ingestion Form"]
        UI_Admin["Admin Triage Queue Dashboard"]
    end

    subgraph SecurityLayer["Edge Shield & Anti-Bot"]
        Turnstile["Cloudflare Turnstile & IP Rate Limiter"]
        URL_Validator["Canonical Drive Link Regex Validator"]
    end

    subgraph ServerlessLayer["Edge & Serverless API Routes"]
        API_Ingest["/api/links/submit (Ingestion Handler)"]
        API_Scan["/api/internal/scan (2-Tier Safety Scanner)"]
        API_Reader["/api/reader/stream (View-Only Proxy)"]
        API_Admin["/api/admin/actions (6-Action Handler)"]
    end

    subgraph ExternalServices["External Infrastructure"]
        GDrive_API["Google Drive REST API v3 (Metadata Only)"]
        SafeBrowsing["Google Safe Browsing API v4"]
        Discord_OAuth["Discord OAuth / Supabase Auth"]
    end

    subgraph DatabaseLayer["Supabase PostgreSQL (Database)"]
        DB_Links[("drive_links")]
        DB_Meta[("link_metadata")]
        DB_Verif[("link_verifications")]
        DB_Actions[("admin_actions")]
        DB_Profiles[("user_profiles")]
    end

    UI_Upload --> Turnstile --> API_Ingest
    UI_Search --> Turnstile --> DB_Links
    UI_Reader --> API_Reader --> GDrive_API
    UI_Admin --> API_Admin --> DB_Actions

    API_Ingest --> URL_Validator --> GDrive_API
    API_Ingest --> DB_Links
    API_Ingest --> API_Scan

    API_Scan --> GDrive_API
    API_Scan --> SafeBrowsing
    API_Scan --> DB_Verif

    API_Admin --> DB_Links
```

---

## 4. End-to-End Ingestion & Verification Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Contributor as Contributor / Submitter
    participant Ingest as /api/links/submit
    participant Scanner as 2-Tier Automated Scanner
    participant Admin as System Administrator
    participant Reader as Public Reader

    Contributor->>Ingest: Submit Google Drive URL + Metadata
    Ingest->>Ingest: Validate Canonical URL Pattern (drive.google.com)
    Ingest->>Scanner: Trigger Synchronous Tier-1 Screening
    Scanner->>Scanner: Verify canEdit == false & Check MIME Allowlist
    Scanner->>Scanner: Query Google Safe Browsing API
    Scanner-->>Ingest: Return Risk Score (0-100) & Flags
    
    alt Clean Work (Risk Score = 0)
        Ingest->>Admin: Queue for Human Verification (Status: PENDING_REVIEW)
    else Threat Detected (Executable / Phishing / Writable)
        Ingest->>Admin: Flag & Auto-Quarantine (Status: FLAGGED)
    end

    Admin->>Admin: Inspect Drive Metadata in Admin Queue
    Admin->>Admin: Execute Action: APPROVE (or REJECT / HIDE / REMOVE)
    Admin-->>Contributor: Notify of Verification Outcome
    
    Reader->>Reader: Search & Browse Verified Feed
    Reader->>Reader: Read Story in View-Only Reader View
```

---

## 5. Architectural Directory Index

Detailed domain specifications are cross-referenced below using relative file paths:

- [Drive Ingestion & Search Specification](drive_ingestion_and_search.md)
- [Security & Verification Pipeline (Automated Scanner & Admin Suite)](security_and_verification_pipeline.md)
- [Reader Sandbox & Anti-Bot Protection](reader_and_anti_bot_protection.md)
- [Database Schema & Search Projections](../database/search_and_display_projection.md)
- [Community Disclaimers & Takedown](../disclaimers/takedown_and_removal_request.md)
