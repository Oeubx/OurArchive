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
