# Proactive Project Advisor (Phase 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a propose-only `advise-project` skill that reads the knowledge base, ingested activity, its own reasoning, and a pluggable live-metrics feed, then files ranked, evidence-grounded ideas (improve/scale/maintain/pattern) into an approval queue + a new AIOS "Ideas" console inbox — shifting the user from originator to approver.

**Architecture:** A new outward-facing Claude Code skill running beside the inward-facing `improve-system`, plus a new `outputs/ideas-*.md` queue (same checkbox/stable-id contract as `review-*.md`), a `raw/metrics/` JSON feed, and a new read-mostly console surface that mirrors the existing Review page end-to-end. The advisor writes only inside `outputs/`; it never applies changes (`improve-system` stays the single applier / single change-log writer). It rides the existing `maintenance-loop` heartbeat.

**Tech Stack:** Claude Code skills (markdown `SKILL.md` + `config.json`), Vite + React 18 + TypeScript + TanStack Query + Tailwind/shadcn console (`aios/`), Vitest for the server parser, `gray-matter` for frontmatter.

**Spec:** `docs/superpowers/specs/2026-06-30-proactive-project-advisor-design.md`

**Two independently-testable parts:**
- **Part A — The brain & scaffolding** (markdown/JSON authoring; verified structurally — there is no unit test for a `SKILL.md`).
- **Part B — The console "Ideas" surface** (real TypeScript; this is where TDD applies, mirroring `aios/server/fileApi.test.ts`).

**Working discipline (load-bearing):**
- **Never execute the advisor against this template repo for real.** This repo *is* the template; running `advise-project` here would write `outputs/ideas-*.md` and ingest the maintainer's real `~/.claude` sessions, polluting the generic base. Verify Part A structurally only (same rule the existing `setup-project` / `maintenance-loop` plans followed).
- **`raw/` is append-only.** Part A adds *new* files under `raw/metrics/`; it never edits existing `raw/` files.
- Commit after each task. Windows line-ending warnings (LF→CRLF) are harmless.

---

## File Structure

**Part A — brain & scaffolding**

| Path | Create/Modify | Responsibility |
|---|---|---|
| `.claude/skills/advise-project/SKILL.md` | Create | The advisor procedure (gather → generate → score → write → promote → age → alert). |
| `.claude/skills/advise-project/config.json` | Create | Tunables: `alert_threshold`, `age_out_ticks`, `max_ideas_per_tick`, `dimensions`. |
| `raw/metrics/.gitkeep` | Create | Keep the new feed dir in git. |
| `raw/metrics/EXAMPLE-dau.json` | Create | A documented sample snapshot (ignored by the advisor via the `EXAMPLE` prefix). |
| `docs/METRICS-FEED.md` | Create | One-page contract: where to drop snapshots, the JSON schema, that it's append-only and vendor-neutral. |
| `outputs/ideas-log.md` | Create | Append-only dedup ledger (the advisor's memory of every idea + final state). |
| `outputs/briefs/.gitkeep` | Create | Keep the project-lane brief dir in git. |
| `.claude/skills/maintenance-loop/SKILL.md` | Modify | Add step 3 (advise) + advisor counts in the run-log block. |
| `CLAUDE.md` | Modify | Add the skill, the `ideas-*.md` queue, and `raw/metrics/` — condensing to stay **< 100 lines**. |
| `docs/SCHEDULING.md` | Modify | One sentence: the advisor rides the same tick. |
| `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` | Modify | A short "Phase 6 addendum" pointer to the Phase 6 spec. |
| `README.md` / `docs/USING-THIS-FOR-ANY-PROJECT.md` | Modify | One-line mention of the proactive advisor. |

**Part B — console surface** (all under `aios/`)

| Path | Create/Modify | Responsibility |
|---|---|---|
| `aios/server/ideas.ts` | Create | Pure `parseIdeaItems()` + `toggleIdeaCheckbox()` + `IdeaItem` type. Kept separate from `fileApi.ts` so neither file grows unwieldy and the load-bearing review code stays untouched. |
| `aios/server/ideas.test.ts` | Create | Vitest unit tests mirroring `fileApi.test.ts`. |
| `aios/server/fileApi.ts` | Modify | `listIdeas()` + two routes: `GET /api/outputs/ideas`, `POST /api/outputs/ideas/check`. |
| `aios/src/lib/fileApi.ts` | Modify | `IdeaItem`/`IdeaFile` types + `ideas()` + `checkIdea()` client calls. |
| `aios/src/hooks/useKb.ts` | Modify | `useIdeas()` + `useToggleIdea()` (mirror `useReviews`/`useToggleReview`). |
| `aios/src/config/features.ts` | Modify | New `ideas` flag (default on). |
| `aios/src/pages/Ideas.tsx` | Create | The inbox: ranked idea cards (dim badge, weight + sub-scores, evidence, next action, approve checkbox). |
| `aios/src/App.tsx` | Modify | Import + feature-gated `/ideas` route. |
| `aios/src/components/layout/AppLayout.tsx` | Modify | Add the `Ideas` nav item. |

---

## The `ideas-*.md` contract (the shared shape both halves depend on)

Anchor line (machine-parseable — the GUI toggles ONLY this line's checkbox), followed by an indented human block:

```
- [ ] `idea-20260630-003` — Add a first-run onboarding checklist  ·  dim: scale  ·  weight: 80  ·  lane: project
      why:   D1→D7 retention is dropping and 3 of your sessions mention users "not sure what to do first."
      score: impact 9 · confidence 7 · effort 4  → ease 7 → weight 80  (strong signal, low effort)
      from:  raw/metrics/2026-06-29-dau.json · raw/inputs/processed/2026-06-27-session.md
      next:  Draft a 4-step in-app onboarding checklist — spec written on approval.
```

- Anchor: `- [ ]` / `- [x]`, then `` `idea-YYYYMMDD-NNN` ``, then `—`, then `text  ·  dim: <improve|scale|maintain|pattern>  ·  weight: <0-100>  ·  lane: <project|foundation>`.
- Block keys (indented): `why:`, `score:`, `from:` (a `·`-separated list of source paths), `next:`.
- Items under a `## Archived` heading are aged-out (rendered collapsed in the console).
- **weight** = `round(10 × (0.5·impact + 0.3·confidence + 0.2·ease))`, where each sub-score is 1–10 and `ease = 11 − effort`.

---

## Part A — The brain & scaffolding

### Task A1: Scaffold the metrics feed

**Files:**
- Create: `raw/metrics/.gitkeep`
- Create: `raw/metrics/EXAMPLE-dau.json`
- Create: `docs/METRICS-FEED.md`

- [ ] **Step 1: Create the dir keeper**

Create `raw/metrics/.gitkeep` (empty file).

- [ ] **Step 2: Create the example snapshot**

Create `raw/metrics/EXAMPLE-dau.json` with exactly:

```json
{
  "captured_at": "2026-06-29T00:00:00Z",
  "metrics": {
    "dau": 100,
    "wau": 420,
    "mau": 1200,
    "d1_retention": 0.22,
    "d7_retention": 0.09,
    "signups": 35,
    "errors": 12,
    "feature_usage": { "search": 540, "upload": 88 }
  },
  "notes": "Example only. Files named EXAMPLE* are ignored by advise-project. Drop real dated snapshots like 2026-06-29-dau.json beside this one."
}
```

- [ ] **Step 3: Write the feed contract doc**

Create `docs/METRICS-FEED.md` documenting: drop a dated JSON snapshot into `raw/metrics/` (e.g. `2026-06-29-dau.json`); each snapshot is a NEW file (because `raw/` is append-only) which is what lets the advisor compute trend deltas; the schema (all fields optional, so partial data degrades gracefully); that anything able to write a file can feed it (the app, a cron, a webhook handler, a Zapier/Make step, a manual paste) — vendor-neutral, no connector ships; and that files named `EXAMPLE*` (and dotfiles) are ignored. Include the JSON example from Step 2.

- [ ] **Step 4: Verify**

Run: `node -e "JSON.parse(require('fs').readFileSync('raw/metrics/EXAMPLE-dau.json','utf8')); console.log('valid json')"`
Expected: `valid json`. Confirm `docs/METRICS-FEED.md` shows the schema and the `EXAMPLE*`-ignored rule.

- [ ] **Step 5: Commit**

```bash
git add raw/metrics/.gitkeep raw/metrics/EXAMPLE-dau.json docs/METRICS-FEED.md
git commit -m "feat(advisor): scaffold raw/metrics feed + METRICS-FEED.md contract"
```

---

### Task A2: Create the ideas ledger + briefs directory

**Files:**
- Create: `outputs/ideas-log.md`
- Create: `outputs/briefs/.gitkeep`

- [ ] **Step 1: Create the dedup ledger**

Create `outputs/ideas-log.md` mirroring the `outputs/change-log.md` shape (frontmatter + header + format note + empty state). Use:

```markdown
---
title: Ideas Log
source_id: outputs:ideas-log
updated: 2026-06-30
---

# Ideas Log

Append-only memory of every idea `advise-project` has raised and how it ended. Written **by
advise-project only**. Newest entries at the top. This is the dedup ledger — an idea already
recorded here is not re-proposed unless its weight materially rises.

Format: `- YYYY-MM-DD — <idea-id> — <proposed | promoted | expired> — <note>`

- `proposed` — newly written to an `ideas-*.md` queue.
- `promoted` — an approved idea turned into a brief (project lane) or a `review-*.md` item
  (foundation lane).
- `expired` — aged out unapproved after `age_out_ticks`.

---

_(no ideas yet)_
```

- [ ] **Step 2: Create the briefs dir keeper**

Create `outputs/briefs/.gitkeep` (empty file).

- [ ] **Step 3: Verify**

Confirm both files exist and `outputs/ideas-log.md` documents the `proposed|promoted|expired` format.

- [ ] **Step 4: Commit**

```bash
git add outputs/ideas-log.md outputs/briefs/.gitkeep
git commit -m "feat(advisor): add ideas-log ledger + briefs/ output dir"
```

---

### Task A3: Write the `advise-project` skill + config

**Files:**
- Create: `.claude/skills/advise-project/config.json`
- Create: `.claude/skills/advise-project/SKILL.md`

- [ ] **Step 1: Create the config**

Create `.claude/skills/advise-project/config.json` with exactly:

```json
{
  "alert_threshold": 70,
  "age_out_ticks": 3,
  "max_ideas_per_tick": 7,
  "dimensions": ["improve", "scale", "maintain", "pattern"]
}
```

- [ ] **Step 2: Write the SKILL.md**

Create `.claude/skills/advise-project/SKILL.md`. It MUST contain frontmatter (`name: advise-project`, plus a `description` that names: outward-facing, propose-only, reads KB + activity + its own reasoning + `raw/metrics/`, writes ranked ideas to `outputs/ideas-*.md`, never applies changes). Body sections: `When to use`, `Inputs (zero-argument, unattended-safe)`, `Procedure`, `Safety invariants`, `Output`. The Procedure must encode the spec exactly:

1. **Gather signals** — `wiki/index.md` + recent pages, `raw/` growth + thin/orphan/stale detection + coverage gaps; recent `raw/inputs/processed/` + `raw/ecosystem/`; the metrics feed `raw/metrics/*.json` (latest snapshot **and the delta vs. the previous**) — **ignore files named `EXAMPLE*` and dotfiles**; project identity (`projectType` + tagline from `aios/src/config/project.ts` / `brand.ts`); `outputs/ideas-log.md` + open `outputs/ideas-*.md`.
2. **Generate candidates across all four lenses** (`improve`/`scale`/`maintain`/`pattern`). **Grounding rule: every idea cites ≥ 1 evidence source in `from:`; a pure-reasoning idea is allowed but labeled low confidence.**
3. **Dedup & re-surface** — drop anything already in `ideas-log.md` or an open queue unless its weight has materially risen.
4. **Score & rank** — each sub-score 1–10; `ease = 11 − effort`; `weight = round(10 × (0.5·impact + 0.3·confidence + 0.2·ease))`; show sub-scores; sort high→low; cap at `max_ideas_per_tick`.
5. **Write the queue** — append new ideas to today's `outputs/ideas-YYYY-MM-DD.md` (new ids, **never renumber**), using the anchor-line + indented-block contract above; log each `proposed` in `ideas-log.md`.
6. **Promote approved** — for any `- [x]` idea from a prior queue: `project` lane → write `outputs/briefs/<id>.md` (a starting spec); `foundation` lane → append a NEEDS SIGN-OFF `rv-YYYYMMDD-NNN` item to today's `outputs/review-*.md` (read the current max id in that file; continue the sequence; never renumber) referencing the source idea. Log `promoted`. **No change to `improve-system`; it stays the single applier.**
7. **Age out & alert** — move ideas older than `age_out_ticks` (tracked via the run-state `tick` counter) under a `## Archived` heading and log `expired`; if any new idea's weight ≥ `alert_threshold`, hand the top items to `human-improve-system`/the notify path (skip + log if unconfigured).
8. **Summarize** — counts per lens, top ideas by weight, what was promoted, what's alerting, path to the queue.

The **Safety invariants** section MUST state: writes only inside `outputs/` (`ideas-*.md`, `ideas-log.md`, `briefs/`, and — only when promoting an approved foundation-lane idea — a proposal item appended to `review-*.md`); never edits `raw/`, `wiki/`, `.claude/skills/`, or project code; never writes `change-log.md`; never auto-applies. Read state from / write state to `outputs/runs/advise-project.json` (`last_run`, `tick`, last-seen metrics cursor), created on first run. Run unattended with no interview; skip missing signals with a logged note.

- [ ] **Step 3: Verify**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/skills/advise-project/config.json','utf8')); console.log('config ok')"`
Expected: `config ok`. Confirm the SKILL.md frontmatter has `name` + `description`, and that the Procedure includes the grounding rule, the weight formula, both promotion lanes, and the propose-only invariants. Cross-check every path it names exists (or is created-on-first-run, like the run-state JSON).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/advise-project/
git commit -m "feat(advisor): add advise-project skill + config"
```

---

### Task A4: Wire `advise-project` into the `maintenance-loop` heartbeat

**Files:**
- Modify: `.claude/skills/maintenance-loop/SKILL.md`

- [ ] **Step 1: Add the advise step**

In `.claude/skills/maintenance-loop/SKILL.md`, after the `improve-system` step (current step 2) and before the "Log the tick" step, insert a new step: **Advise.** Run `advise-project` unattended. It reads the KB, ingested activity, the `raw/metrics/` feed, and its own reasoning, then files ranked ideas to `outputs/ideas-*.md`, promotes any approved ideas, ages out stale ones, and alerts on high-weight ideas. It is propose-only and safe unattended — it never applies a change. Renumber the subsequent steps. Update the "Log the tick" step and the `## Output` section so the run-log block also records advisor counts (ideas proposed / promoted / alerted).

- [ ] **Step 2: Verify**

Confirm the SKILL.md now lists three work steps (ingest → improve → advise) before logging, the advise step is described as unattended + propose-only, and the run-log/output mentions advisor counts.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/maintenance-loop/SKILL.md
git commit -m "feat(advisor): run advise-project as maintenance-loop step 3"
```

---

### Task A5: Update `CLAUDE.md` (must stay < 100 lines)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Record the starting line count**

Run: `wc -l CLAUDE.md`
Expected: `99` (the current cap). Note it — the file must end **< 100** lines.

- [ ] **Step 2: Make room, then add the three references**

Add: (a) `raw/metrics/` to the `raw/` subfolder list in the three-folder section; (b) the `outputs/ideas-*.md` queue to the `outputs/` description; (c) an `advise-project` one-liner to the Skills list (e.g. *"`advise-project` — outward-facing, propose-only: reads the KB + activity + `raw/metrics/` and files ranked project ideas to `outputs/ideas-*.md` for your approval; never applies changes"*); and a half-line noting the advisor rides the `maintenance-loop` tick. Because the file is at its cap, **condense existing wording** (tighten verbose lines / merge two short bullets) so the net stays under 100. Do not remove a load-bearing rule.

- [ ] **Step 3: Verify the cap held**

Run: `wc -l CLAUDE.md`
Expected: a number `< 100`. Then `git grep -n "advise-project\|ideas-\*\|raw/metrics" CLAUDE.md` shows all three references present.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(advisor): pin advise-project + ideas queue + raw/metrics in CLAUDE.md (<100 lines)"
```

---

### Task A6: Doc touch-ups

**Files:**
- Modify: `docs/SCHEDULING.md`
- Modify: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`
- Modify: `README.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`

- [ ] **Step 1: SCHEDULING.md**

Add one sentence where the maintenance tick is described: the same weekly tick now also runs `advise-project`, so proactive ideas accumulate on the same schedule.

- [ ] **Step 2: Design-spec addendum pointer**

At the end of `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`, add a short **"## Phase 6 addendum"** noting the proactive project advisor shipped and pointing to `docs/superpowers/specs/2026-06-30-proactive-project-advisor-design.md`.

- [ ] **Step 3: README + USING mention**

In `README.md` ("What you get" or "Under the hood") and `docs/USING-THIS-FOR-ANY-PROJECT.md`, add a one-line mention that the build proactively proposes improve/scale/maintain ideas you approve (with a relative link to the metrics feed / advisor where natural).

- [ ] **Step 4: Verify**

`git grep -n "advise-project\|proactive\|METRICS-FEED" docs README.md` shows the new mentions; any new relative links resolve to real files.

- [ ] **Step 5: Commit**

```bash
git add docs/SCHEDULING.md docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md README.md docs/USING-THIS-FOR-ANY-PROJECT.md
git commit -m "docs(advisor): mention proactive advisor in scheduling/spec/readme/using docs"
```

---

## Part B — The console "Ideas" surface

> Run all commands from `aios/`. Test runner: `npm run test` (vitest). Type gate: `npm run typecheck`.

### Task B1: The ideas parser + toggle (TDD)

**Files:**
- Test: `aios/server/ideas.test.ts`
- Create: `aios/server/ideas.ts`

- [ ] **Step 1: Write the failing test**

Create `aios/server/ideas.test.ts` mirroring `fileApi.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- ideas`
Expected: FAIL — `Failed to resolve import "./ideas"` / `parseIdeaItems is not a function`.

- [ ] **Step 3: Implement `aios/server/ideas.ts`**

Mirror the `fileApi.ts` review parser style. Anchor regex: `/^\s*-\s*\[([ xX])\]\s*`(idea-[^`]+)`\s*(.*)$/`. After an anchor, consume indented `key: value` lines (`why|score|from|next`) until the next anchor or a non-block line. Track a `## Archived` heading to set `archived`. Split the anchor's trailing text on `·` into `text` (first segment) and the `dim:` / `weight:` / `lane:` fields; parse `weight` to a number. Split `from:` on `·` into a string array. `toggleIdeaCheckbox` flips ONLY the matching anchor line's `[ ]`↔`[x]` (preserve EOL style; no-op on unknown id or already-in-state), exactly like `toggleReviewCheckbox`.

```ts
export interface IdeaItem {
  id: string;
  checked: boolean;
  text: string;
  dim?: string;
  weight?: number;
  lane?: string;
  why?: string;
  score?: string;
  from?: string[];
  next?: string;
  archived: boolean;
  raw: string;
}

const ANCHOR_RE = /^\s*-\s*\[([ xX])\]\s*`(idea-[^`]+)`\s*(.*)$/;
const BLOCK_RE = /^\s+(why|score|from|next):\s*(.*)$/i;
const ARCHIVED_RE = /^#{1,6}\s+.*archived/i;

export function parseIdeaItems(markdown: string): IdeaItem[] {
  const items: IdeaItem[] = [];
  let archived = false;
  let current: IdeaItem | null = null;
  for (const line of markdown.split(/\r?\n/)) {
    if (ARCHIVED_RE.test(line)) { archived = true; current = null; continue; }
    const a = ANCHOR_RE.exec(line);
    if (a) {
      const rest = a[3].trim().replace(/^[—–-]\s*/, "");
      const segs = rest.split("·").map((s) => s.trim()).filter(Boolean);
      const item: IdeaItem = {
        id: a[2], checked: a[1].toLowerCase() === "x", text: "", archived, raw: line,
      };
      segs.forEach((seg, i) => {
        const low = seg.toLowerCase();
        if (low.startsWith("dim:")) item.dim = seg.slice(seg.indexOf(":") + 1).trim();
        else if (low.startsWith("weight:")) item.weight = Number(seg.slice(seg.indexOf(":") + 1).trim());
        else if (low.startsWith("lane:")) item.lane = seg.slice(seg.indexOf(":") + 1).trim();
        else if (i === 0 || !item.text) item.text = seg;
      });
      items.push(item);
      current = item;
      continue;
    }
    const b = current ? BLOCK_RE.exec(line) : null;
    if (b && current) {
      const key = b[1].toLowerCase();
      const val = b[2].trim();
      if (key === "from") current.from = val.split("·").map((s) => s.trim()).filter(Boolean);
      else (current as Record<string, unknown>)[key] = val;
    } else if (line.trim() !== "" && !BLOCK_RE.test(line)) {
      current = null; // a non-blank, non-block line ends the current item's block
    }
  }
  return items;
}

export function toggleIdeaCheckbox(markdown: string, id: string, checked: boolean): string {
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n";
  let changed = false;
  const next = markdown.split(/\r?\n/).map((line) => {
    const m = ANCHOR_RE.exec(line);
    if (m && m[2] === id) {
      const replaced = line.replace(/\[[ xX]\]/, `[${checked ? "x" : " "}]`);
      if (replaced !== line) changed = true;
      return replaced;
    }
    return line;
  });
  return changed ? next.join(eol) : markdown;
}
```

> Note: review the block-terminator condition while implementing — the intent is "a blank line or another indented block line does not end the item, but a new non-indented prose line does." Keep the logic equivalent to that intent and let the tests drive it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- ideas`
Expected: PASS (all cases). If the Archived/terminator logic trips, adjust `parseIdeaItems` until green.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add aios/server/ideas.ts aios/server/ideas.test.ts
git commit -m "feat(aios): ideas-*.md parser + checkbox toggle (TDD)"
```

---

### Task B2: Wire the ideas endpoints into the file API

**Files:**
- Modify: `aios/server/fileApi.ts`

- [ ] **Step 1: Import + add `listIdeas()`**

In `aios/server/fileApi.ts`, import `parseIdeaItems`, `toggleIdeaCheckbox`, and the `IdeaItem` type from `./ideas`. Add a `listIdeas()` helper modeled on `listReviews()`, using the existing `listOutputFiles("ideas")`:

```ts
import { parseIdeaItems, toggleIdeaCheckbox, type IdeaItem } from "./ideas";

interface IdeaFilePayload { file: string; title: string; items: IdeaItem[]; }

async function listIdeas(): Promise<IdeaFilePayload[]> {
  // listOutputFiles("ideas") ALSO matches the dedup ledger ideas-log.md (it
  // starts with "ideas-"). Exclude it: it has no idea anchor lines, so it would
  // render a spurious empty card AND keep `files` non-empty, making the page's
  // EmptyState ("No ideas yet…") unreachable on a fresh clone.
  const files = (await listOutputFiles("ideas")).filter((f) => f !== "ideas-log.md");
  const out: IdeaFilePayload[] = [];
  for (const file of files) {
    const parsed = matter(await fs.readFile(path.join(OUTPUTS_DIR, file), "utf8"));
    const data = parsed.data as Record<string, unknown>;
    const title = typeof data.title === "string" ? data.title : file;
    out.push({ file, title, items: parseIdeaItems(parsed.content) });
  }
  return out;
}
```

- [ ] **Step 2: Add the two routes**

Inside `handleFileApi`, beside the review routes, add a GET list and a POST toggle. The POST guard must be `^ideas-[^/\\]+\.md$` and it must re-parse with `parseIdeaItems` to return the authoritative item:

```ts
if (method === "GET" && route === "/api/outputs/ideas") {
  sendJson(res, 200, { files: await listIdeas() });
  return true;
}

if (method === "POST" && route === "/api/outputs/ideas/check") {
  const body = await readJsonBody(req);
  const file = String(body.file ?? "");
  const id = String(body.id ?? "");
  const checked = Boolean(body.checked);
  if (!/^ideas-[^/\\]+\.md$/.test(file)) { sendJson(res, 400, { error: "Invalid ideas file." }); return true; }
  const abs = path.join(OUTPUTS_DIR, file);
  if (!existsSync(abs)) { sendJson(res, 404, { error: "Ideas file not found." }); return true; }
  const original = await fs.readFile(abs, "utf8");
  const updated = toggleIdeaCheckbox(original, id, checked);
  if (updated !== original) await fs.writeFile(abs, updated, "utf8");
  const item = parseIdeaItems(matter(updated).content).find((i) => i.id === id) ?? null;
  sendJson(res, 200, { ok: true, changed: updated !== original, item });
  return true;
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck` (no errors) and `npm run test` (existing suite still green — this task adds HTTP glue, which the repo verifies by typecheck + smoke, consistent with how the review endpoints are tested).

- [ ] **Step 4: Commit**

```bash
git add aios/server/fileApi.ts
git commit -m "feat(aios): GET /api/outputs/ideas + POST /api/outputs/ideas/check"
```

---

### Task B3: Client API wrapper

**Files:**
- Modify: `aios/src/lib/fileApi.ts`

- [ ] **Step 1: Add types + client calls**

In `aios/src/lib/fileApi.ts`, add an `IdeaItem` interface (mirroring the server `IdeaItem`: `id, checked, text, dim?, weight?, lane?, why?, score?, from?: string[], next?, archived, raw`) and an `IdeaFile` (`file, title, items: IdeaItem[]`). Add to the `fileApi` object:

```ts
ideas: () => getJson<{ files: IdeaFile[] }>("/api/outputs/ideas").then((r) => r.files),

checkIdea: async (file: string, id: string, checked: boolean) => {
  const res = await fetch("/api/outputs/ideas/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, id, checked }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Toggle failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as { ok: boolean; changed: boolean; item: IdeaItem | null };
},
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` (no errors).

```bash
git add aios/src/lib/fileApi.ts
git commit -m "feat(aios): client wrapper for ideas list + toggle"
```

---

### Task B4: Query hooks

**Files:**
- Modify: `aios/src/hooks/useKb.ts`

- [ ] **Step 1: Add `useIdeas` + `useToggleIdea`**

Mirror `useReviews`/`useToggleReview` exactly, with query key `["kb", "ideas"]`, optimistic flip of the cached `IdeaFile[]`, rollback on error, and invalidation of `["kb","ideas"]` + `["kb","stats"]` on settle. Import `IdeaFile` from `@/lib/fileApi`.

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` (no errors).

```bash
git add aios/src/hooks/useKb.ts
git commit -m "feat(aios): useIdeas + useToggleIdea hooks"
```

---

### Task B5: Feature flag

**Files:**
- Modify: `aios/src/config/features.ts`

- [ ] **Step 1: Add the `ideas` flag**

Add `ideas: boolean;` to `FeatureFlags` (with a doc comment: *"The proactive project advisor's idea inbox (approve a checkbox to accept an idea)."*) and `ideas: true,` to the `features` object. `FeatureKey` updates automatically.

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` (no errors).

```bash
git add aios/src/config/features.ts
git commit -m "feat(aios): add ideas feature flag (default on)"
```

---

### Task B6: The Ideas page

**Files:**
- Create: `aios/src/pages/Ideas.tsx`

- [ ] **Step 1: Build the page**

Create `aios/src/pages/Ideas.tsx` modeled on `Review.tsx`. Use `useIdeas()` + `useToggleIdea()`. For each file (`Card`), render its items **sorted by weight descending**, splitting **active** (render normally) from **archived** (render under a collapsed `<details>` "Archived" section). Each idea row is a `<label>` with the approve checkbox (left) and, on the right: a row of badges (`dim` via `Badge`, a `weight: N` chip, and an `approved` badge when checked), the `text` as the heading, then small muted lines for `why`, `score`, `next`, and the `from` sources rendered as monospace chips. Use the same `PageHeader` (eyebrow "Proactive advisor", title "Ideas", description explaining: *the advisor proposes these from your KB, activity, and metrics; check a box to approve — approving drafts a brief or a review item, it never ships a change*), `EmptyState` (icon e.g. `Lightbulb` from lucide-react; "No ideas yet — the advisor proposes them on the maintenance tick"), `Spinner`, `Badge`, and `Card` primitives already used by `Review.tsx`. Keep the toggle wiring identical to `Review.tsx` (`toggle.mutate({ file, id, checked })`, optimistic via the hook, `toggle.isError` message).

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` (no errors).

```bash
git add aios/src/pages/Ideas.tsx
git commit -m "feat(aios): Ideas inbox page (ranked cards + approve checkbox)"
```

---

### Task B7: Route + nav, then full verification

**Files:**
- Modify: `aios/src/App.tsx`
- Modify: `aios/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Add the route**

In `aios/src/App.tsx`: `import Ideas from "@/pages/Ideas";` and add, beside the review route, `{features.ideas && <Route path="ideas" element={<Ideas />} />}`.

- [ ] **Step 2: Add the nav item**

In `aios/src/components/layout/AppLayout.tsx`, add to the `NAV` array (right after the Review entry): `{ to: "/ideas", label: "Ideas", feature: "ideas" }`.

- [ ] **Step 3: Full verification**

Run, from `aios/`:
- `npm run typecheck` → no errors
- `npm run test` → all green (incl. the new `ideas.test.ts`)
- `npm run build` → succeeds

Then a manual smoke (optional but recommended): create a scratch `outputs/ideas-2026-06-30.md` containing the SAMPLE from B1, run `npm run dev`, open `/ideas`, confirm cards render sorted by weight, the Archived section is collapsed, and toggling a checkbox persists (the only write). **Delete the scratch file afterward** so the template stays generic.

- [ ] **Step 4: Commit**

```bash
git add aios/src/App.tsx aios/src/components/layout/AppLayout.tsx
git commit -m "feat(aios): wire /ideas route + nav (feature-gated)"
```

---

## Final: close-out

- [ ] **Step 1: Whole-suite green**

From `aios/`: `npm run typecheck && npm run test && npm run build` all succeed. From repo root: `wc -l CLAUDE.md` is `< 100`.

- [ ] **Step 2: Confirm the template was not specialized or polluted**

`git status` is clean; no real `outputs/ideas-*.md`, no `outputs/runs/advise-project.json`, no real `raw/metrics/*.json` (only `EXAMPLE-dau.json`) committed. The advisor was never executed for real against this repo.

- [ ] **Step 3: Update memory**

Append a line to `MEMORY.md` / update `hma-foundation-overview.md` noting Phase 6 (proactive project advisor) shipped.

- [ ] **Step 4: Push** (only if the user asks)

```bash
git push origin main
```

---

## Verification checklist (maps to the spec's Verification section)

- [ ] Every path/field the skill names matches repo shapes (`features.ts` flags, `review-*.md` item conventions, run-state JSON, the notify path).
- [ ] `parseIdeaItems`/`toggleIdeaCheckbox` unit tests pass; toggle changes exactly one anchor line and never the indented block.
- [ ] Endpoints typecheck; the POST guard rejects non-`ideas-*.md` files.
- [ ] The advisor writes only inside `outputs/`; never `change-log.md`; foundation-lane promotion targets `review-*.md` (improve-system unchanged).
- [ ] `maintenance-loop` runs ingest → improve → advise; run-log records advisor counts.
- [ ] `CLAUDE.md` < 100 lines with all three new references.
- [ ] Console: Ideas inbox lists ideas, sorts by weight, collapses Archived, and its only write is toggling a checkbox; `npm run build` green.
