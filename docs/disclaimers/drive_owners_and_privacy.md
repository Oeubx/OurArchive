# Google Drive Owners & Privacy Notice

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. Scope for Drive Link Owners

Community members and archivists who maintain Google Drive folders or files often share public links so others can read saved fanfiction during primary archive downtime. This document outlines how OurArchive interacts with Google Drive links and protects Drive owners.

---

## 2. View-Only Permission Enforcement

OurArchive enforces strict link permission validation upon submission:
1. **Public View-Only Requirement**: The system only accepts Google Drive links configured with `"Anyone with the link can view"` (`canEdit == false`).
2. **Rejection of Edit Access**: Any link that inadvertently grants edit permissions (`canEdit == true` or `role: "writer"`) will be rejected or flagged by the automated scanner to prevent malicious vandalism of the owner's Google Drive files.
3. **No Direct Account Connection Required**: Drive owners do not need to connect their personal Google accounts to OurArchive via OAuth. Submissions are simply public URL references.

---

## 3. Metadata & Privacy Considerations

When a public Google Drive link is submitted, Google Drive's API returns standard public metadata associated with the file:
- File Name and MIME type.
- File Size and Last Modified Date.
- Drive Owner Display Name and public email (if exposed in public Drive sharing headers).

### Privacy & Masking Safeguards
- If a Drive owner prefers their personal email or real name not to appear in the system, OurArchive allows the link uploader or administrator to **mask the owner's identifier** or replace it with a pseudonym.
- Drive owners can request instant masking or total delisting at any time by contacting the administrator (see [Takedown & Removal Request](takedown_and_removal_request.md)).

---

## 4. Drive Owner Control & Revocation

Drive owners retain 100% control over their files at the Google Drive source:
- **Revoking Access at Google**: If you change the sharing permission on your Google Drive link to `"Restricted"`, OurArchive's view-only reader will immediately lose access, and the system's background checker will automatically flag and hide the link from public search.
- **Admin Delisting**: You can also contact the administrator to have the link permanently deleted from OurArchive's database.

---

## 5. Protection Against Scraping & Bot Harvesting

To prevent automated malicious bots from harvesting public Drive links:
- Drive URLs are not rendered in raw, unprotected plaintext across public search index pages.
- Readers access works through an ephemeral reader view.
- To view the underlying Google Drive link or path, readers must trigger an intentional action (`[View Drive Link / Path]`), which is protected by edge rate limits and bot challenges.
