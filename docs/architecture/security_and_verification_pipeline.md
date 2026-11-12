# Security & Verification Pipeline

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. Security Architecture Overview

Because opening arbitrary web links can expose community members to malware, phishing, and malicious exploits, OurArchive implements a rigorous **dual-layer defense model**:
1. **Automated Threat Screening**: Instantaneous, lightweight inspection using Google Drive API metadata and Google Safe Browsing API.
2. **Human Administrator Verification**: An administrative triage queue empowering system operators with a comprehensive **6-Action Suite**.

---

## 2. Two-Tier Automated Threat Scanner

To process thousands of links efficiently without serverless memory overflows, execution timeouts, or bandwidth expenses, the system **never downloads full files**. Instead, it inspects file attributes and metadata via APIs:

```mermaid
flowchart TD
    A[Drive Link Submitted] --> B[Tier 1: Synchronous Inspection ~200ms]
    
    subgraph Tier1["Tier 1: Instant Ingestion Filter"]
        B --> C[Validate Domain Regex]
        C --> D[Google Drive API: files.get metadata]
        D --> E{canEdit == false?}
        E -->|No| F[Flag: Public Writable Link]
        E -->|Yes| G{MIME Type in Allowlist?}
        G -->|No| H[Flag: Prohibited Binary / Executable]
        G -->|Yes| I[Google Safe Browsing API Lookup]
        I --> J{Safe Browsing Clean?}
        J -->|No| K[Flag: Known Malware / Phishing]
        J -->|Yes| L[Compute Risk Score 0-100]
    end

    L --> M{Risk Score > 0?}
    M -->|Yes| N[Status: FLAGGED - Auto-Quarantined]
    M -->|No| O[Status: PENDING_REVIEW]

    O --> P[Tier 2: Asynchronous Content Indexing]
    subgraph Tier2["Tier 2: Background Indexing"]
        P --> Q[Fetch Text Excerpt via Docs Export <= 5MB]
        Q --> R[Extract Chapter Count & Word Count]
        R --> S[Index Full-Text Search Vectors]
    end

    S --> T[Notify Admin Triage Queue]
```

### 2.1 MIME Type Allowlist
Only reading and document formats are permitted:
- `application/pdf`
- `text/html`
- `text/plain`
- `application/vnd.google-apps.document` (Google Docs)
- `application/epub+zip`

**Strictly Prohibited Extensions & MIME Types**:
- Executables & Scripts: `.exe`, `.scr`, `.bat`, `.cmd`, `.vbs`, `.js`, `.ps1`, `.apk`, `.msi`.
- Macro-Enabled Office Files: `.docm`, `.xlsm`, `.pptm`.
- Encrypted / Password-Protected Archives.

### 2.2 Risk Scoring Model (0–100)
- **Score 0**: Clean document, verified view-only, clean Google Safe Browsing verdict.
- **Score 30–50**: Missing metadata, unusual MIME type, or newly created uploader account.
- **Score 80–100**: Direct executable extension, Google Safe Browsing alert, or public edit permissions enabled. Any link scoring ≥ 80 is immediately quarantined with `status = 'flagged'`.

---

## 3. Administrator 6-Action Suite

System administrators review links in the triage dashboard. The operator has six direct administrative actions available for every link record:

| Action | Technical Execution | State Transition | Audit Log Record |
| :--- | :--- | :--- | :--- |
| **1. VERIFY** | Re-triggers the automated threat scanner, queries live Drive API metadata, and inspects public owner details. | `pending_scan` -> `pending_review` | `admin_actions: action_type='VERIFY'` |
| **2. APPROVE** | Validates the work as genuine fanfiction and safe. Issues the `VERIFIED BY ADMIN` badge and publishes to public search. | `pending_review` -> `verified` (`is_hidden=FALSE`) | `admin_actions: action_type='APPROVE'` |
| **3. REJECT** | Marks the link as ineligible (e.g. broken permissions, non-fanfic media, commercial piracy). Excludes from public search. | `pending_review` -> `rejected` | `admin_actions: action_type='REJECT'` |
| **4. HIDE** | Instantly toggles visibility off without deleting data. Used for temporary review or upon owner request. | Any status -> `is_hidden = TRUE` | `admin_actions: action_type='HIDE'` |
| **5. CONTACT** | Generates a direct communication prompt or notification to the submitter or Drive owner regarding permissions or metadata. | Maintains current status | `admin_actions: action_type='CONTACT'` |
| **6. REMOVE** | Permanently expunges the link and all cascading metadata, search vectors, and audit logs immediately. | Record Deleted from PostgreSQL | Cascade Deletion Completed |

---

## 4. State Machine & Status Transitions

```mermaid
stateDiagram-v2
    [*] --> PENDING_SCAN: Submission Ingested
    PENDING_SCAN --> FLAGGED: Threat Detected / Score >= 80
    PENDING_SCAN --> PENDING_REVIEW: Clean Scan / Score < 80
    
    PENDING_REVIEW --> VERIFIED: Admin Action: APPROVE
    PENDING_REVIEW --> REJECTED: Admin Action: REJECT
    FLAGGED --> REJECTED: Admin Confirms Threat
    
    VERIFIED --> HIDDEN: Admin Action: HIDE
    HIDDEN --> VERIFIED: Admin Action: UNHIDE
    
    VERIFIED --> [*]: Admin Action: REMOVE (Permanent Purge)
    REJECTED --> [*]: Admin Action: REMOVE (Permanent Purge)
    FLAGGED --> [*]: Admin Action: REMOVE (Permanent Purge)
```

---

## 5. Incident Response & Immediate Takedowns

When an author, Drive owner, or community member submits a takedown notice:
1. **Zero-Delay Hide**: Admin executes **HIDE** in seconds, removing the work from search feeds and viewer proxies immediately.
2. **Permanent Cascade Purge**: Admin executes **REMOVE**, issuing:
   ```sql
   DELETE FROM public.drive_links WHERE id = '<target_link_id>';
   ```
   PostgreSQL `ON DELETE CASCADE` constraints automatically delete all associated records in `link_metadata` and `link_verifications`.
3. **Audit Closure**: An entry is recorded in the administrative log confirming the takedown request was satisfied.
