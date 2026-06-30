import { describe, it, expect } from "vitest";
import { parseIdeaItems, toggleIdeaCheckbox } from "./ideas";

const SAMPLE = `# Ideas — 2026-06-30

Intro prose, ignored.

- [ ] \`idea-20260630-001\` — Add a first-run onboarding checklist  ·  dim: scale  ·  weight: 80  ·  lane: project
      why:   D1→D7 retention is dropping.
      score: impact 9 · confidence 7 · effort 4 → ease 7 → weight 80
      from:  raw/metrics/2026-06-29-dau.json · raw/inputs/processed/2026-06-27-session.md
      next:  Draft a 4-step onboarding checklist.
- [x] \`idea-20260630-002\` — Tighten the search index  ·  dim: improve  ·  weight: 55  ·  lane: foundation
      why:   Two wiki pages are orphaned.
      from:  wiki/index.md
      next:  Re-link the orphans.

## Archived

- [ ] \`idea-20260628-009\` — Old idea nobody approved  ·  dim: pattern  ·  weight: 30  ·  lane: project
      why:   Weak one-off signal.
      from:  raw/inputs/processed/2026-06-20-session.md
      next:  Revisit if it recurs.
`;

describe("parseIdeaItems", () => {
  it("extracts anchor fields + indented block fields", () => {
    const items = parseIdeaItems(SAMPLE);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      id: "idea-20260630-001",
      checked: false,
      text: "Add a first-run onboarding checklist",
      dim: "scale",
      weight: 80,
      lane: "project",
      why: "D1→D7 retention is dropping.",
      score: "impact 9 · confidence 7 · effort 4 → ease 7 → weight 80",
      next: "Draft a 4-step onboarding checklist.",
      archived: false,
    });
    expect(items[0].from).toEqual([
      "raw/metrics/2026-06-29-dau.json",
      "raw/inputs/processed/2026-06-27-session.md",
    ]);
    expect(items[1]).toMatchObject({ id: "idea-20260630-002", checked: true, lane: "foundation" });
  });

  it("flags items under an Archived heading", () => {
    const items = parseIdeaItems(SAMPLE);
    expect(items.find((i) => i.id === "idea-20260628-009")?.archived).toBe(true);
  });
});

describe("toggleIdeaCheckbox", () => {
  it("flips only the targeted anchor line and never the indented block", () => {
    const out = toggleIdeaCheckbox(SAMPLE, "idea-20260630-001", true);
    const before = SAMPLE.split(/\r?\n/);
    const after = out.split(/\r?\n/);
    const diff = before.map((l, i) => (l !== after[i] ? i : -1)).filter((i) => i !== -1);
    expect(diff).toHaveLength(1);
    expect(after[diff[0]]).toContain("[x]");
    expect(after[diff[0]]).toContain("idea-20260630-001");
    expect(parseIdeaItems(out).find((i) => i.id === "idea-20260630-001")?.checked).toBe(true);
  });

  it("flips [x] back to [ ]", () => {
    const out = toggleIdeaCheckbox(SAMPLE, "idea-20260630-002", false);
    expect(parseIdeaItems(out).find((i) => i.id === "idea-20260630-002")?.checked).toBe(false);
  });

  it("is a no-op for an unknown id", () => {
    expect(toggleIdeaCheckbox(SAMPLE, "idea-99999999-999", true)).toBe(SAMPLE);
  });

  it("is a no-op when already in the requested state", () => {
    expect(toggleIdeaCheckbox(SAMPLE, "idea-20260630-002", true)).toBe(SAMPLE);
  });
});
