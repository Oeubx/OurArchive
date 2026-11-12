# Search & Display Projection Architecture

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. UI Display Standard

Per system requirements, every search result card and work listing in OurArchive conforms to a standardized layout:

```text
========================================================================================
SYSTEM HEADER: OurArchive Emergency Mirror (Temporary Read-Only Library)
========================================================================================
[ DISPLAYED FILE ]
Title: "To Build a Home" (Chapters 1 - 5)
Author: @starlight_scribe | Fandom: Heartstopper | Rating: General Audiences
Words: 24,180 | Updated: Nov 1, 2026
Summary: "A temporary view-only mirror of the seaside vacation arc, saved during 
the recent archive maintenance."
Tags: [Fluff, Mutual Pining, Beach Days, Found Family]

----------------------------------------------------------------------------------------
[ FILE DETAILS & CONTROLS ]
• Drive Owner: @archive_volunteer / vol***@gmail.com (Masked for privacy)
• Upload Mode: Authenticated Contributor (@reader_charlie)
• Uploaded At: Nov 1, 2026, 13:45 UTC
• Safety Score: 0/100 (Clean - MIME: application/pdf)
• Verification: ✅ VERIFIED BY ADMIN (@biboy at 14:10 UTC)
• Public Actions:
    [ 👁️ Read Work in Clean Viewer ]
    [ 🔗 View Drive Link / Path ]
• Administrative / Owner Controls:
    [ 🚫 Hide This File ]       [ 🗑️ Remove Permanently ]
========================================================================================
```

---

## 2. PostgreSQL Projection Views

To provide zero-latency responses to the frontend search components, the database uses PostgreSQL views that join `drive_links`, `link_metadata`, and `link_verifications`.

### 2.1 Public Search View (`vw_public_search_feed`)
Returns verified, unhidden works for public anonymous or authenticated search queries:

```sql
CREATE OR REPLACE VIEW public.vw_public_search_feed AS
SELECT 
    dl.id AS work_id,
    dl.upload_mode,
    dl.created_at AS uploaded_at,
    
    -- {displayed file} fields
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.pairing,
    lm.rating,
    lm.word_count,
    lm.summary,
    lm.tags,
    lm.mime_type,
    
    -- {file details} fields
    CASE 
        WHEN lm.is_owner_masked THEN 
            regexp_replace(lm.drive_owner_email, '(?<=^.{2}).*?(?=@)', '***')
        ELSE lm.drive_owner_name
    END AS display_drive_owner,
    
    lv.verification_badge,
    lv.admin_verified_at,
    lv.automated_risk_score,
    
    -- Drive path reveal token (obfuscated reference, not raw URL)
    encode(digest(dl.drive_url, 'sha256'), 'hex') AS path_reveal_token

FROM public.drive_links dl
JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id
WHERE dl.verification_status = 'verified'
  AND dl.is_hidden = FALSE
  AND dl.is_removed = FALSE;
```

---

### 2.2 Administrator Triage View (`vw_admin_triage_feed`)
Accessible only to users with `role = 'admin'`. Surfaces unverified, flagged, and hidden links for administrative review:

```sql
CREATE OR REPLACE VIEW public.vw_admin_triage_feed AS
SELECT 
    dl.id AS link_id,
    dl.drive_url,
    dl.google_file_id,
    dl.upload_mode,
    dl.verification_status,
    dl.is_hidden,
    dl.is_removed,
    dl.created_at AS uploaded_at,
    
    lm.title,
    lm.author_name,
    lm.fandom,
    lm.file_name,
    lm.mime_type,
    lm.file_size_bytes,
    lm.drive_owner_name,
    lm.drive_owner_email,
    
    lv.automated_risk_score,
    lv.automated_flags,
    lv.scanner_passed,
    lv.admin_verified_by,
    lv.admin_verified_at,
    lv.admin_notes

FROM public.drive_links dl
JOIN public.link_metadata lm ON dl.id = lm.link_id
LEFT JOIN public.link_verifications lv ON dl.id = lv.link_id;
```

---

## 3. Frontend JSON Contract

When a reader performs a search, the backend returns payloads structured to match the layout:

```json
{
  "system_header": {
    "platform_title": "OurArchive Emergency Mirror",
    "status": "Temporary Read-Only Operation",
    "notice": "Community emergency bridge during archive downtime. Works belong 100% to authors."
  },
  "displayed_file": {
    "work_id": "7f891b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "title": "To Build a Home",
    "author": "starlight_scribe",
    "fandom": "Heartstopper",
    "pairing": "Nick Nelson/Charlie Spring",
    "rating": "General Audiences",
    "word_count": 24180,
    "summary": "A temporary view-only mirror of the seaside vacation arc...",
    "tags": ["Fluff", "Mutual Pining", "Beach Days"]
  },
  "file_details_and_controls": {
    "drive_owner": "vol***@gmail.com",
    "upload_mode": "authenticated",
    "uploaded_at": "2026-11-01T13:45:00Z",
    "verification": {
      "badge": "VERIFIED BY ADMIN",
      "verified_at": "2026-11-01T14:10:00Z",
      "risk_score": 0
    },
    "controls": {
      "can_hide": true,
      "path_reveal_token": "a8f3b...9e1"
    }
  }
}
```

---

## 4. Drive Link / Path Reveal Protocol

To balance public transparency with anti-bot protection:
1. **Raw Link Masking**: Search results do not embed the raw `https://drive.google.com/...` string in public HTML to prevent automated scrapers from mass-harvesting links.
2. **Intentional Reveal Trigger**: When a reader clicks `[View Drive Link / Path]`:
   - An ephemeral API request is dispatched with the `path_reveal_token`.
   - The user's IP is checked against rate limits (max 10 link reveals per minute).
   - A modal displays the canonical view-only Drive URL with a direct button: `Open in Google Drive (Read-Only)`.
