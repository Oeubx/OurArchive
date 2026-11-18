# Module 2 Specification: Drive Link Ingestion & Processing

> **Module:** Module 2 — Drive Upload, Reading & Searching  
> **Commit Codes:** `OA-M2-F1`, `OA-M2-F2`

---

## 1. Google Drive URL Normalization Pipeline

When a link is submitted, the ingestion endpoint executes:

1. **Protocol & Host Sanitization**:
   - Trims whitespace and strips dangerous schemes (`javascript:`, `data:`).
   - Validates that the host matches `drive.google.com` or `docs.google.com`.
2. **File ID Extraction**:
   - Uses regex extraction to parse the unique Google file ID:
     ```typescript
     export function extractGoogleDriveId(url: string): string | null {
       const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
       return match ? match[1] : null;
     }
     ```
3. **Canonical View URL Reconstruction**:
   - Standardizes the stored URL to:
     `https://drive.google.com/file/d/{file_id}/view?usp=sharing`

---

## 2. Google Drive API Metadata Extraction

Using `GOOGLE_DRIVE_API_KEY`, the server queries Google Drive REST API v3:
```http
GET https://www.googleapis.com/drive/v3/files/{file_id}?fields=id,name,mimeType,size,capabilities(canEdit),owners(displayName,emailAddress)&key={API_KEY}
```

### Response Mapping to `link_metadata`:
- `file_name` <- `response.name`
- `mime_type` <- `response.mimeType`
- `file_size_bytes` <- `response.size || 0`
- `drive_owner_name` <- `response.owners[0].displayName`
- `drive_owner_email` <- `response.owners[0].emailAddress`
- `canEdit` validation:
  - If `response.capabilities.canEdit === true`, the link is flagged as writable and rejected or quarantined.

---

## 3. Ephemeral Reader Stream Generation

To serve the distraction-free reader without downloading files to disk:
1. For Google Docs (`mimeType: application/vnd.google-apps.document`):
   - Fetches text using export URL:
     `https://docs.google.com/feeds/download/documents/export/Export?id={file_id}&exportFormat=html`
2. For uploaded PDFs (`mimeType: application/pdf`):
   - Streams directly into an isolated PDF canvas viewer.
3. DOMPurify cleans the HTML stream, stripping script tags, tracking images, and iframes before delivering the payload to the frontend.

---

## 4. First-Page Fanwork Metadata Scanning (Deterministic, Zero AI)

To support rich cataloging and granular search filtering, the system supports scanning page 1 of uploaded works:
1. **In-Memory Ephemeral Stream**:
   - The server streams the first page buffer directly via `unpdf` without writing file data to local storage.
2. **Deterministic Tokenization (`metadata-parser.ts`)**:
   - Parses standard fanwork cover headers (`Rating:`, `Archive Warning(s):`, `Categor(y|ies):`, `Fandom(s):`, `Relationship(s):`, `Characters:`, `Additional Tags:`, `Language:`, `Stats:`).
   - Computes deterministic SFW/NSFW classification (`Rating: Explicit|Mature` or explicit trope tags -> `nsfw`).
   - Flags completion status (`Chapters: X/X` -> `is_complete = true`).
3. **Graceful Fallback**:
   - If a plain document lacks standard cover headers, returns `isStandardCoverFormatted: false` and preserves manual form inputs.

---

## 5. Personal Archive, Contributor Reading & Role-Based Link Masking [OA-M2-F6, OA-M3-F6]

Contributors can utilize OurArchive as their personal fanwork archive/vault alongside public community indexing:

1. **Pre-Upload Personal Vault Selection (`isPersonalArchive`)**:
   - In `UploadModal`, contributors can designate an upload as **Personal Archive (Private Vault)** (`is_hidden: true`).
   - Private personal archive works are suppressed from public search indexes, library feeds, and community discoverability.
2. **Immediate Contributor Read Access (Pre-Approval Reading)**:
   - Contributed works are immediately streamable by their original uploader in Reader mode (`/reader/[id]`), even while in `verification_status = 'under_verification'` ("In Queue").
   - External readers are restricted until the work is verified by moderators and set to public.
3. **Owner-Bypass Authorization in Reader Mode**:
   - If `link.is_hidden === true`, the reader endpoint (`/api/reader/[id]`) verifies whether the viewer is the owner (`uploader_user_id === user.id`) or an Administrator.
   - Non-owners receive `403: This fanwork is stored in the contributor's private personal archive.`
4. **Post-Upload Granular Visibility Control**:
   - On the Contribute portal (`/contribute`), contributors can toggle their works between `Personal Archive 🔒` and `Public 🌐` via `PATCH /api/contribute/visibility`.
5. **Role-Based Link Masking for Verifiers vs. Admins**:
   - If a contributor toggles a work to private/personal (`is_hidden = true`), the raw Google Drive URL is **strictly masked** for Verifiers in all reveal endpoints (`/api/links/reveal`) and review desks.
   - Administrators retain unmasked raw URL inspection privileges for compliance and legal triage.

