import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseFirstPageMetadata } from "../metadata-parser.ts";

describe("parseFirstPageMetadata - Deterministic Fanwork Scanner", () => {
  it("parses explicit fanwork cover with full metadata (Sample 1)", () => {
    const sample = `
Make me lose my breath, make me water
Posted originally on the Archive of Our Own at https://archiveofourown.org/works/83233311.

Rating: Explicit
Archive Warning: Creator Chose Not To Use Archive Warnings
Category: F/F
Fandom: NMIXX (Band)
Relationship: Bae Jinsol | Bae/Seol Yoona | Sullyoon
Characters: Bae Jinsol | Bae, Seol Yoona | Sullyoon, Oh Haewon
Additional Tags: Swimmer, Secret Relationship, Fluff and Smut, They are switches here, but mostly - Freeform, Service Top Bae Jinsol | Bae, Power Bottom Seol Yoona | Sullyoon, Oral Sex, Vaginal Fingering, Needy Bossy Bratty Sullyoon, Bae just being whatever Sullyoon needs, Porn with Plot, Rivals to Lovers, Rivals with Benefits
Language: English
Stats: Published: 2026-04-17 Completed: 2026-05-27 Words: 20,164 Chapters: 3/3
`;

    const res = parseFirstPageMetadata(sample);
    assert.equal(res.success, true);
    assert.equal(res.isStandardCoverFormatted, true);
    assert.equal(res.metadata.title, "Make me lose my breath, make me water");
    assert.equal(res.metadata.canonicalSourceUrl, "https://archiveofourown.org/works/83233311");
    assert.equal(res.metadata.rating, "Explicit");
    assert.deepEqual(res.metadata.warnings, ["Creator Chose Not To Use Archive Warnings"]);
    assert.deepEqual(res.metadata.categories, ["F/F"]);
    assert.equal(res.metadata.fandom, "NMIXX (Band)");
    assert.equal(res.metadata.pairing, "Bae Jinsol | Bae/Seol Yoona | Sullyoon");
    assert.equal(res.metadata.characters.length, 3);
    assert.equal(res.metadata.wordCount, 20164);
    assert.equal(res.metadata.chapters, "3/3");
    assert.equal(res.metadata.isComplete, true);
    assert.equal(res.metadata.publishedDate, "2026-04-17");
    assert.equal(res.metadata.completedDate, "2026-05-27");
    assert.equal(res.metadata.isNsfw, true);
    assert.equal(res.metadata.classification, "nsfw");
  });

  it("parses mature fanwork cover with complete chapters (Sample 2)", () => {
    const sample = `
Nothing Serious
Posted originally on the Archive of Our Own at https://archiveofourown.org/works/67286242.

Rating: Mature
Archive Warning: No Archive Warnings Apply
Category: F/F
Fandom: NMIXX (Band)
Relationship: Bae Jinsol | Bae/Seol Yoona | Sullyoon
Characters: Bae Jinsol | Bae, Seol Yoona | Sullyoon, Oh Haewon, Lily Morrow, Jang Kyujin, Kim Jiwoo (NMIXX)
Additional Tags: College AU, Friends With Benefits to Lovers, FWB, Slow Burn, Denial of Feelings, Vulnerability, Falling In Love, Casual, but is it?, Mentioned Liz but like two lines, just needed another person and love her, Trust
Language: English
Stats: Published: 2025-07-08 Words: 24,123 Chapters: 9/9
`;

    const res = parseFirstPageMetadata(sample);
    assert.equal(res.success, true);
    assert.equal(res.isStandardCoverFormatted, true);
    assert.equal(res.metadata.title, "Nothing Serious");
    assert.equal(res.metadata.rating, "Mature");
    assert.deepEqual(res.metadata.categories, ["F/F"]);
    assert.equal(res.metadata.wordCount, 24123);
    assert.equal(res.metadata.chapters, "9/9");
    assert.equal(res.metadata.isComplete, true);
    assert.equal(res.metadata.isNsfw, true);
  });

  it("classifies General Audiences fanwork as SFW", () => {
    const sample = `
Morning Coffee and Friendly Whispers
Posted originally on the Archive of Our Own at https://archiveofourown.org/works/12345678.

Rating: General Audiences
Archive Warning: No Archive Warnings Apply
Category: Gen
Fandom: Original Work
Characters: Alice, Bob
Additional Tags: Fluff, Friendship, Slice of Life
Language: English
Stats: Published: 2026-01-01 Words: 1,500 Chapters: 1/1
`;

    const res = parseFirstPageMetadata(sample);
    assert.equal(res.metadata.rating, "General Audiences");
    assert.equal(res.metadata.isNsfw, false);
    assert.equal(res.metadata.classification, "sfw");
  });

  it("handles incomplete multi-chapter fanworks correctly", () => {
    const sample = `
The Ongoing Journey
Rating: Teen And Up Audiences
Fandom: Adventure Story
Stats: Words: 5,432 Chapters: 2/?
`;

    const res = parseFirstPageMetadata(sample);
    assert.equal(res.metadata.chapters, "2/?");
    assert.equal(res.metadata.isComplete, false);
    assert.equal(res.metadata.isNsfw, false);
  });

  it("gracefully falls back for plain documents without standard cover tags", () => {
    const plainText = `
Chapter One
It was a dark and stormy night. The wind howled through the open window as she sat by the fireplace reading an old manuscript.
`;

    const res = parseFirstPageMetadata(plainText, "my-story-backup.txt");
    assert.equal(res.success, true);
    assert.equal(res.isStandardCoverFormatted, false);
    assert.equal(res.metadata.title, "my story backup");
    assert.equal(res.metadata.rating, "Not Rated");
    assert.equal(res.metadata.isNsfw, false);
    assert.equal(res.metadata.classification, "sfw");
    assert.deepEqual(res.metadata.categories, []);
    assert.deepEqual(res.metadata.warnings, []);
  });
});
