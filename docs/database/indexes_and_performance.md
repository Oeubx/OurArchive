# Database Indexes & Performance Optimization

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid Archive of Our Own (AO3) users during service outages and is strictly not intended to replace, compete with, or replicate the permanent operations of Archive of Our Own (AO3) or the Organization for Transformative Works (OTW).

---

## 1. Indexing Strategy Overview

To ensure rapid sub-50ms search responses across thousands of indexed fan works during traffic surges, OurArchive implements a three-tier indexing strategy:
1. **Full-Text Search (GIN)**: Weighted search across titles, fandoms, author names, and summaries.
2. **Tag Array Search (GIN)**: Fast inclusion searches across fandom tags and tropes (`@> ARRAY['Fluff']`).
3. **Composite B-Tree Indexes**: Instantaneous filtering on visibility, verification status, and timestamp ordering.

---

## 2. Full-Text Search Vector & GIN Indexes

### 2.1 Generated `tsvector` Column
A generated column is added to `link_metadata` with weighted search priorities:
- **Weight A**: Title (highest search relevance).
- **Weight B**: Fandom and Author Name.
- **Weight C**: Summary.

```sql
ALTER TABLE public.link_metadata 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(fandom, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(author_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_link_metadata_search 
ON public.link_metadata USING GIN (search_vector);
```

### 2.2 Tag Array Index
Enables instantaneous multi-tag filtering (e.g. searching for works tagged with both `Enemies to Lovers` and `Alternate Universe`):

```sql
CREATE INDEX IF NOT EXISTS idx_link_metadata_tags 
ON public.link_metadata USING GIN (tags);
```

---

## 3. High-Throughput Composite B-Tree Indexes

### 3.1 Public Feed Filter Index
Powers the primary public reader view by skipping any sequential table scans:

```sql
CREATE INDEX IF NOT EXISTS idx_drive_links_public_feed 
ON public.drive_links (verification_status, is_hidden, is_removed, created_at DESC);
```

### 3.2 Duplicate Submission Prevention
Prevents duplicate ingestion of identical Google Drive files while allowing re-submission if an old link was purged:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_drive_links_file_id_active 
ON public.drive_links (google_file_id) 
WHERE is_removed = FALSE;
```

### 3.3 Admin Triage Index
Accelerates the administrator dashboard review queue:

```sql
CREATE INDEX IF NOT EXISTS idx_drive_links_admin_queue 
ON public.drive_links (verification_status, created_at ASC) 
WHERE verification_status IN ('pending_scan', 'pending_review', 'flagged');
```

---

## 4. Keyset (Cursor-Based) Pagination Pattern

To maintain consistent query latency and prevent memory bloat on large result sets, the frontend uses cursor-based keyset pagination rather than `OFFSET / LIMIT`:

```sql
-- Fetch next page of 20 verified works using keyset cursor
SELECT * FROM public.vw_public_search_feed
WHERE (uploaded_at, work_id) < ('2026-11-01 13:45:00+00', '7f891b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c'::uuid)
ORDER BY uploaded_at DESC, work_id DESC
LIMIT 20;
```

---

## 5. Anti-Bot Query Throttling & Connection Hygiene

1. **Prepared Statements & Parameterization**: All queries from edge functions use parameterized inputs to prevent SQL injection and allow PostgreSQL plan caching.
2. **Statement Timeout Protection**:
   ```sql
   ALTER ROLE authenticated SET statement_timeout = '3000ms';
   ALTER ROLE anon SET statement_timeout = '2000ms';
   ```
   Ensures runaway queries are terminated within 2–3 seconds, protecting free-tier CPU resources.
