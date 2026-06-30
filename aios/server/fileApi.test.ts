import { describe, it, expect } from "vitest";
import { parseReviewItems, toggleReviewCheckbox, parseQuestions } from "./fileApi";

// A representative review-*.md body, matching the pinned contract:
//   - [ ] `rv-YYYYMMDD-NNN` — <text>  ·  target: <path>  ·  detail: <detail>
const SAMPLE = `# Review Queue — 2026-06-29

Some intro prose that is not an item and must be ignored.

- [ ] \`rv-20260629-001\` — Rename wiki topic pages  ·  target: wiki/index.md  ·  detail: merge the two AI pages
- [x] \`rv-20260629-002\` — Add tags to curated posts  ·  target: raw/curated/  ·  detail: backfill missing tags
- [ ] \`rv-20260629-003\` — New skill: link-checker  ·  target: .claude/skills/  ·  detail: proposes a link audit

> A trailing quote, also ignored.
`;

describe("parseReviewItems", () => {
  it("extracts every checkbox item with id, state, text, target, detail", () => {
    const items = parseReviewItems(SAMPLE);
    expect(items).toHaveLength(3);

    expect(items[0]).toMatchObject({
      id: "rv-20260629-001",
      checked: false,
      text: "Rename wiki topic pages",
      target: "wiki/index.md",
      detail: "merge the two AI pages",
    });
    expect(items[1]).toMatchObject({ id: "rv-20260629-002", checked: true });
    expect(items[2].id).toBe("rv-20260629-003");
  });

  it("ignores non-item lines (prose, headings, quotes)", () => {
    const items = parseReviewItems(SAMPLE);
    expect(items.map((i) => i.id)).toEqual([
      "rv-20260629-001",
      "rv-20260629-002",
      "rv-20260629-003",
    ]);
  });
});

describe("toggleReviewCheckbox", () => {
  it("flips only the targeted line from [ ] to [x]", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-20260629-001", true);
    const items = parseReviewItems(out);
    expect(items.find((i) => i.id === "rv-20260629-001")?.checked).toBe(true);
    // The other items are untouched.
    expect(items.find((i) => i.id === "rv-20260629-002")?.checked).toBe(true);
    expect(items.find((i) => i.id === "rv-20260629-003")?.checked).toBe(false);
  });

  it("flips a line from [x] back to [ ]", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-20260629-002", false);
    expect(parseReviewItems(out).find((i) => i.id === "rv-20260629-002")?.checked).toBe(false);
  });

  it("changes nothing but the one targeted line (byte-for-byte elsewhere)", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-20260629-003", true);
    const before = SAMPLE.split(/\r?\n/);
    const after = out.split(/\r?\n/);
    const diffIdx = before
      .map((line, i) => (line !== after[i] ? i : -1))
      .filter((i) => i !== -1);
    expect(diffIdx).toHaveLength(1);
    expect(after[diffIdx[0]]).toContain("[x]");
    expect(after[diffIdx[0]]).toContain("rv-20260629-003");
  });

  it("is a no-op for an unknown id (returns the original string unchanged)", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-99999999-999", true);
    expect(out).toBe(SAMPLE);
  });

  it("is a no-op when the box is already in the requested state", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-20260629-002", true); // already [x]
    expect(out).toBe(SAMPLE);
  });

  it("does not touch the id token or reorder items", () => {
    const out = toggleReviewCheckbox(SAMPLE, "rv-20260629-001", true);
    expect(out).toContain("`rv-20260629-001`");
    expect(parseReviewItems(out).map((i) => i.id)).toEqual([
      "rv-20260629-001",
      "rv-20260629-002",
      "rv-20260629-003",
    ]);
  });
});

describe("parseQuestions", () => {
  it("collects free-text list items as open questions", () => {
    const body = `# Needs context\n\nIntro.\n\n- What timezone should runs use?\n* Which Slack channel?\n1. Do we keep drafts?\n`;
    expect(parseQuestions(body)).toEqual([
      "What timezone should runs use?",
      "Which Slack channel?",
      "Do we keep drafts?",
    ]);
  });
});
