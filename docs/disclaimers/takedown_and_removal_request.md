# Immediate Takedown & Removal Request Policy

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.

---

## 1. The Immediate Takedown Guarantee

If you are a fanfic author, a Google Drive owner, a copyright holder, or a user who submitted a link and you wish to have your work or owned property removed from OurArchive:

> **You only have to reach out, and the administrator will remove it immediately.**

- **Zero Bureaucracy**: You do not need to issue formal legal notices or notarized documents.
- **Zero Resistance**: We will not debate, challenge, or delay your request.
- **Total Expulsion**: Removal is permanent. The Google Drive URL, cached title, author metadata, and search index tokens will be permanently expunged from the database immediately upon receipt.

---

## 2. Who Can Request Removal?

You can request immediate removal if you are:
1. **The Original Author** of the fanfiction work (even if someone else submitted the Google Drive backup link).
2. **The Google Drive Link Owner** whose drive folder or file was submitted to the directory.
3. **The Submitter** who uploaded the link and now wishes to revoke it.
4. **Any Community Member** reporting a malicious file, phishing link, copyright infringement, commercial piracy, or broken permission.

---

## 3. How to Submit a Removal Request

To request an immediate removal, contact the administrator through any of the following channels:

### Option A: Email (Fastest)
- **Send an email to:** `takedown@example.com` *(or configured `NEXT_PUBLIC_TAKEDOWN_EMAIL`)*
- **Subject Line:** `[TAKEDOWN] Removal Request - {Document Title or Drive URL}`
- **Information to Include:**
  - The URL of the Google Drive link, OR
  - The Title and Category of the entry as displayed on the platform.
  - (Optional) Confirmation of creator or owner status, or reason for removal.

### Option B: Direct Takedown Portal
- Use the built-in `/takedown` portal on the platform to submit an immediate removal request.

### Option C: GitHub Issue
- Open an issue in this repository with the label `takedown` (or use a private issue/email if you prefer not to publicize the request).

---

## 4. What Happens When a Request is Received?

Upon receiving your notice, the Administrator executes the following automated and database procedures:
1. **Instant Hide (Seconds)**: The link's visibility flag `is_hidden` is set to `TRUE`, instantly removing it from the public search index, reader feed, and API responses.
2. **Permanent Cascade Purge**: The record is permanently deleted from the `drive_links` table, cascading to delete:
   - All associated search tokens in `link_metadata`.
   - All audit records and verification logs in `link_verifications`.
   - All reader session tokens associated with that Drive ID.
3. **Confirmation Reply**: The administrator sends a confirmation message to notify you that the link has been completely purged.

---

## 5. Temporary Hiding vs. Permanent Deletion

If you are a Drive owner or author who wants the link temporarily suppressed (for example, while you update the Google Drive permissions or clean up formatting), let the administrator know. We can apply an administrative **HIDE** status rather than a permanent deletion, and unhide it whenever you are ready.
