# Module 2: Drive Upload, Reading & Searching

> **Module Code:** `OA-M2`  
> **Scope:** Canonical Google Drive ingestion, view-only permission verification, metadata parsing, full-text search, and reader sandbox UI.

---

## 1. Module Overview

Module 2 delivers the core user experience for readers and archivists:
1. **Canonical Drive Link Parsing**: Strict regex matching for Google Drive and Google Docs URLs; rejection of shorteners and redirects.
2. **Read-Only / Zero-Download Enforcement**: Calling Drive API `files.get` to verify `canEdit == false`.
3. **Dual-Path Upload Model**: Direct self-service submission alongside the Assisted Admin Upload intake channel.
4. **Weighted Full-Text Search**: Fast title, author, fandom, and tag searching powered by PostgreSQL `tsvector` and GIN indexes.
5. **Standardized Display Card**:
   ```text
   SYSTEM HEADER
   {displayed file} {file details and an option to hide it}
   [Option to view Google Drive link / path]
   ```
6. **Ephemeral Reader Mode**: Clean, distraction-free reading without file downloading.

---

## 2. Features & Backlog Items

| Commit Code | Feature | Documentation File |
| :--- | :--- | :--- |
| `OA-M2-F0` | Ingestion & Search Maintenance | [`README.md`](README.md) |
| `OA-M2-F1` | Canonical Drive Link Ingestion | [`drive_link_processing_spec.md`](drive_link_processing_spec.md) |
| `OA-M2-F2` | Fanfiction Metadata Extraction | [`drive_link_processing_spec.md`](drive_link_processing_spec.md) |
| `OA-M2-F3` | Full-Text & Multi-Tag Search | [`../../database/indexes_and_performance.md`](../../database/indexes_and_performance.md) |
| `OA-M2-F4` | Distraction-Free Reader Mode | [`../../architecture/reader_and_anti_bot_protection.md`](../../architecture/reader_and_anti_bot_protection.md) |
| `OA-M2-F5` | Standard Display Card Projection | [`../../database/search_and_display_projection.md`](../../database/search_and_display_projection.md) |
| `OA-M2-F6` | Dual-Path Upload Model | [`../../architecture/drive_ingestion_and_search.md`](../../architecture/drive_ingestion_and_search.md) |

---

## 3. Related Specifications
- [Drive Ingestion & Search Architecture](../../architecture/drive_ingestion_and_search.md)
- [Search & Display Projection DDL](../../database/search_and_display_projection.md)
- [Reader Sandbox & Anti-Bot Protection](../../architecture/reader_and_anti_bot_protection.md)
