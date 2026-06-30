# define-design Skill (Phase 9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone, attended `define-design` skill that grills the user into a portable design system (`wiki/design-system.md`) — the look-and-feel north star any UI reads — the way `define-project` grills them into a charter; Google Stitch–aware (manual paste-back default, optional MCP, graceful-off), with an opt-in step that themes the AIOS console.

**Architecture:** A new interview-first Claude Code skill (sibling of `define-project`) that reads `wiki/charter.md` to *recommend* a design direction, runs a propose-don't-just-ask interview, captures immutable Stitch exports under `raw/design/<date>-<slug>/`, distills them into `wiki/design-system.md`, cross-links `wiki/index.md`, and — only on an explicit yes — regenerates the console's `index.css` color tokens + `brand.ts` words. Light wiring touches `setup-project`, `define-project`, `what-can-i-do`, `advise-project`, `CLAUDE.md`, and the docs. `improve-system` is not modified.

**Tech Stack:** Claude Code skills (markdown `SKILL.md` + `config.json`), the existing file-based KB (`raw/` immutable, `wiki/` AI-written, `outputs/change-log.md`), the `aios/` console's HSL token surface (`aios/src/index.css`) + `aios/src/config/brand.ts`, Google Stitch (`stitch.withgoogle.com`) and an optional Stitch MCP (key in `aios/.env`).

**Spec:** `docs/superpowers/specs/2026-06-30-define-design-design.md`
**Branch:** `phase-9-define-design` (already created; the spec is already committed on it).

**Nature of this work:** almost entirely **authoring** (a skill, a config, docs, and light wiring edits to other skills/docs) — there is **no new TypeScript and no unit-test framework** for skills here, so tasks are verified **structurally** (content covers the spec; JSON parses; paths are real; `wc -l`/`grep` checks) exactly like Phase 7 (codex-review) and Phase 8 (define-project). Do NOT invent a test harness, and do NOT add aios code — the console theming is a *runtime behavior the skill performs*, described in prose, not shipped code.

**Working discipline (load-bearing — read before starting):**
- **This repo IS the template; keep it generic.** Do **NOT** run a real design interview here, do **NOT** create a real `wiki/design-system.md` or any `raw/design/<date>-…` record, and do **NOT** theme this repo's console. The only design artifact that ships is `raw/design/.gitkeep`.
- **`raw/` is immutable / append-only.** The skill's raw record is a new dated *folder* each run; never mutate existing files. Same real-path provenance rule as `define-project` (use the actual folder name, incl. any same-day suffix, in frontmatter / footer / change-log).
- **Console theming is opt-in + attended.** It edits only `aios/src/index.css` (new token-regeneration logic; the documented re-theme surface) and `aios/src/config/brand.ts` (also edited by `setup-project`), only on an explicit yes, logged to `change-log.md`, **never** in the unattended loop. Note: `setup-project` does *not* touch `index.css` today — this is the first skill to regenerate it, so write the instructions from scratch (don't reference a reusable routine).
- **The Stitch / Google AI API key never enters chat or a committed file.** It lives in `aios/.env` (empty slot + comment); the user fills it. Privacy: using Stitch/the MCP sends prompts (and any uploaded screenshots) to Google — documented, opt-in.
- **`improve-system` is NOT touched** — it stays the single applier / single `change-log.md` writer for the self-improvement lanes. `define-design` logs its own attended change-log line, exactly as `define-project`/`setup-project` do for their attended writes.
- **`CLAUDE.md` must stay < 100 lines** (it's at **98**). Budget for condensing existing wording (per its own "Maintaining this file" policy: *condense wording, never a rule*) — do not blindly append.
- Commit after each task. Windows LF→CRLF warnings are harmless.

---

## File Structure

| Path | Create/Modify | Responsibility |
|---|---|---|
| `.claude/skills/define-design/config.json` | Create | `default_archetype`, `theme_console`, `mcp_enabled`. |
| `raw/design/.gitkeep` | Create | Holds the immutable per-run Stitch-export folders (empty in the template). |
| `.claude/skills/define-design/SKILL.md` | Create | The interview → capture → distill → opt-in-theme procedure. Mirrors `define-project` house style. |
| `docs/DESIGN-SYSTEM.md` | Create | Stitch workflow, MCP + key setup (key in `aios/.env`, never chat), the `design-system.md` shape, the console-token mapping, the privacy note. |
| `.claude/skills/setup-project/SKILL.md` | Modify | Add a "design check" beside the existing charter check (offer/use `define-design`). |
| `.claude/skills/define-project/SKILL.md` | Modify | Closing pointer: next, define how it *looks* → `define-design`. |
| `.claude/skills/what-can-i-do/SKILL.md` | Modify | Add a plain-language "make it look great" menu item. |
| `.claude/skills/advise-project/SKILL.md` | Modify | Light: read `wiki/design-system.md` as a signal; may surface a "define your design" idea when absent. |
| `CLAUDE.md` | Modify | One Skills bullet + a `raw/design/` line (which also names the north star). Stays **< 100 lines** (condense to fit). |
| `docs/USING-THIS-FOR-ANY-PROJECT.md` | Modify | Add `define-design` to the "define it first" sequence + note the Stitch MCP as an optional capability. |
| `README.md` | Modify | One-line design mention in "Make it your project" (+ a "What you get" bullet; + Phase 9 in build status). |
| `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` | Modify | Short addendum pointer to this Phase 9 work. |

**Style-archetype library (shared vocabulary — the skill's lost-user anchor):** *Minimal / focused* (Linear, Notion) · *Warm / editorial* (content, portfolios) · *Bold / playful* (consumer) · *Professional / dashboard* (B2B, data, AIOS — the console's current look) · *Elegant / premium* (brand/luxury).

**Palette contract:** the design system records colors as **HSL token triplets** in the exact shape `aios/src/index.css` uses — `--primary: H S% L%` (space-separated, no `hsl()` wrapper), for both `:root` (light) and `.dark`, covering the named tokens `background, foreground, card, primary, secondary, muted, accent, destructive, success, warning, border, input, ring`. This makes the opt-in console apply a mechanical value swap.

---

## Task 1: Scaffolding — config + raw/design dir

**Files:**
- Create: `.claude/skills/define-design/config.json`
- Create: `raw/design/.gitkeep`

- [ ] **Step 1: Create the config**

`.claude/skills/define-design/config.json` with EXACTLY:
```json
{
  "default_archetype": "",
  "theme_console": true,
  "mcp_enabled": false
}
```
(`default_archetype`: optional pre-pick, empty = ask. `theme_console`: offer the opt-in apply step. `mcp_enabled`: the single Stitch toggle — `false` = the manual paste-back default; `true` + `STITCH_API_KEY` in `aios/.env` = drive the Stitch MCP, graceful-off self-skips if the key is absent.)

- [ ] **Step 2: Create the raw record dir keeper**

Create `raw/design/.gitkeep` (empty file).

- [ ] **Step 3: Verify**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/skills/define-design/config.json','utf8'));console.log('config ok')"` → expect `config ok`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/define-design/config.json raw/design/.gitkeep
git commit -m "feat(define-design): scaffold config + raw/design record dir"
```

---

## Task 2: The `define-design` SKILL.md

**Files:**
- Create: `.claude/skills/define-design/SKILL.md`

- [ ] **Step 1: Read the model skill first**

Read `.claude/skills/define-project/SKILL.md` in full — match its house style: frontmatter (`name` + a rich `description` ending with "Zero-argument safe: run with no arguments and it opens the interview."), and sections `When to use` / `Inputs (interview first; zero-argument safe)` / `Procedure` / `The …​ shape` / `Output`. Also skim `aios/src/index.css` (the token shape) and `docs/WIKI-FRONTMATTER.md` (the frontmatter the wiki page must use).

- [ ] **Step 2: Write the SKILL.md**

Frontmatter `name: define-design` + a `description` naming: a design-discovery interview that grills the user (propose-don't-just-ask, with style options + a recommended default) into a portable **design system** at `wiki/design-system.md` (the look-and-feel north star); Google Stitch–aware (manual default, optional MCP, graceful-off); re-runnable for a restyle; offers to theme the AIOS console; zero-argument safe.

The body MUST encode the spec's procedure exactly:

**`## When to use`** — first design pass on a fresh clone (after/with `define-project`); on a restyle/pivot (reads the current `wiki/design-system.md` for defaults, focuses on what's changing); when UI work needs a consistent look.

**`## Inputs (interview first; zero-argument safe)`** — no arguments; opens the interview. On a re-run, read `wiki/design-system.md` first for defaults. Read behaviour from `.claude/skills/define-design/config.json` (`default_archetype`, `theme_console`, `mcp_enabled`). Never block on a missing file/key.

**`## Procedure`** with these phases:

- **Phase 0 — Read the charter.** Before the first question, read `wiki/charter.md` if present (project type, audience, brand words, voice) and use it to **infer a recommended design direction**. If absent, suggest `define-project` first but proceed.
- **Phase 1 — Design interview (propose-don't-just-ask, ONE question per message).** Open warmly + set expectations ("if you're unsure, I'll suggest directions and a recommendation — pick and tweak"). Walk these dimensions **in order**, and the moment an answer is thin/"I don't know," offer **2–4 concrete options + a recommended default** inferred from the charter/prior answers:
  1. **Style direction** *(lost-user anchor)* — offer the **style-archetype library** (Minimal / Warm-editorial / Bold / Professional-dashboard / Elegant), recommending the fit.
  2. **Color & mood** — seed a palette or "match my logo / brand words"; captured as the HSL token triplets defined in the Palette contract.
  3. **Typography & shape** — type pairing + corner radius / density.
  4. **Voice & imagery** — microcopy tone; illustration vs photo vs flat.
  5. **Targets & constraints** — web / mobile / both; dark-first?; contrast targets; must-keep brand marks.
  Guardrails: **2–3 follow-up cap** per dimension; record the recommended default flagged `(assumed — confirm later)` when still vague; never loop.
- **Phase 2 — Stitch step (tiered, graceful-off).** *Default (no keys):* emit a **ready-to-paste Stitch prompt** (assembled from the interview) + a `DESIGN.md` scaffold; direct the user to `stitch.withgoogle.com`, have them generate + iterate, then drop the export (Stitch's `design.md` + screenshots) into the dated `raw/design/` folder. If they skip Stitch, synthesize from the interview alone (Stitch is an accelerator, not a dependency). *Optional climb (MCP):* if `mcp_enabled` and the Stitch MCP's key is present in `aios/.env` and the user opts in, generate/pull designs directly and save into `raw/design/`. Absent key/MCP → **cleanly fall back to the manual path** (log the skip; never block). **Never collect the key in chat.**
- **Phase 3 — Draft-confirm gate.** Reflect back a complete **draft design system** (all dimensions + flagged assumptions + a palette preview) in one message; only proceed on confirmation (or revise + re-confirm).
- **Phase 4 — Write the raw record.** Save the export / interview capture under a **dated folder** `raw/design/<YYYY-MM-DD>-<slug>/` (export files + a distilled capture file with standard frontmatter), append-only; same-day reruns use a disambiguating suffix (`-<slug>-2/`). **Use the real folder path everywhere** it's referenced (frontmatter `source_id`/`path`, the design-system footer, the change-log line).
- **Phase 5 — Write/update `wiki/design-system.md`.** Create (first run) or update in place (re-run) using the shape below; bump `updated:`; on a re-run append a link to the new raw record alongside priors. Normal AI wiki maintenance — writes to `wiki/` directly, no sign-off.
- **Phase 6 — Cross-link `wiki/index.md`.** Add/maintain a **top/pinned** entry under "By area" + a "Recent additions" line, same pattern `add-new-resource` uses.
- **Phase 7 — Offer console theming (opt-in, approved).** Ask whether to apply now. **Only on an explicit yes**, edit `aios/src/index.css` (regenerate the `:root`/`.dark` HSL color tokens from the palette — **new logic; preserve the file's comments/structure, change only token values**) and `aios/src/config/brand.ts` (productName / tagline / assistant words if voice changed). Attended + user-approved + logged — never autonomous, never in the loop.
- **Phase 8 — Log the change.** Append one attributed line to `outputs/change-log.md`:
  `- <date> — define-design — wrote design system (wiki/design-system.md) from raw/design/<folder>[; themed aios console] — auto|applied` (`applied` when the console was themed).

**`## The design system (wiki/design-system.md) shape`** — include this template verbatim:
```markdown
---
title: Design System
source_id: wiki:design-system
path: wiki/design-system.md
tags: [design, design-system, ui, brand, meta]
updated: <YYYY-MM-DD>
---

# Design System

**Direction:** <archetype + the feeling, e.g. "Professional dashboard, calm and precise">

## Palette
<HSL token triplets mapping onto aios/src/index.css — background, foreground, card,
primary, secondary, muted, accent, destructive, success, warning, border, input, ring —
for :root and .dark.>

## Typography & shape
<Type pairing (display/body), weights, --radius, density.>

## Components & layout
<Buttons, cards, inputs, nav; spacing scale; elevation/shadow; motion notes.>

## Voice & imagery
<Microcopy tone; illustration/photo/flat; iconography.>

## Accessibility & targets
<Contrast targets, dark-first?, web/mobile/both, must-keep brand marks.>

## Stitch prompt
<The ready-to-paste prompt that regenerates/iterates this system in Google Stitch.>

## Open questions / assumptions
<Anything flagged "assumed — confirm later".>

---
*Source: raw/design/<YYYY-MM-DD>-<slug>/ (Google Stitch export + discovery interview).*
```

**`## Safety invariants`** MUST state: `raw/design/` immutable/append-only (new dated folders only); `wiki/design-system.md` is normal AI wiki maintenance; console theming edits ONLY `index.css` + `brand.ts`, opt-in + attended + logged, never in the loop; never collects/reads-back/writes the Stitch key (env only); `improve-system` untouched (single applier); and the **privacy note** (Stitch/MCP sends prompts + uploaded screenshots to Google; opt-in, user's key).

**`## Output`** — a short end summary modeled on `define-project`'s: the raw folder written, the charter-equivalent `wiki/design-system.md` created/updated, the `wiki/index.md` cross-links, the change-log line, whether the console was themed, and a reminder of any `(assumed — confirm later)` items.

- [ ] **Step 3: Verify (structural)**

Confirm: frontmatter has `name` + a zero-arg `description`; the Procedure covers charter-read inference, propose-don't-just-ask, the five dimensions + archetype library, the 2–3 follow-up cap + `(assumed — confirm later)`, the draft-confirm gate, the tiered Stitch step **with manual fallback + no key in chat**, the append-only dated-**folder** raw write with real-path provenance, the wiki write + index cross-link, the **opt-in** console-theming step (index.css + brand.ts only), and the change-log line; the `design-system.md` template matches `docs/WIKI-FRONTMATTER.md`; the Palette contract matches `aios/src/index.css`'s `--token: H S% L%` shape. Every path it names is real or created-at-runtime.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/define-design/SKILL.md
git commit -m "feat(define-design): add the design-discovery skill (propose-don't-just-ask, Stitch-aware)"
```

---

## Task 3: `docs/DESIGN-SYSTEM.md`

**Files:**
- Create: `docs/DESIGN-SYSTEM.md`

- [ ] **Step 1: Write the doc**

A one-page guide (CLAUDE.md-policy style — this doc holds the detail so CLAUDE.md stays a pointer) covering: (a) **what it is** — `wiki/design-system.md` is the look-and-feel north star Claude reads before building any UI; (b) **the Google Stitch workflow** — generate UI from natural language or screenshots at `stitch.withgoogle.com`, iterate (e.g. palette), export the `design.md` + screenshots into `raw/design/<date>-<slug>/`, and `define-design` distills them; (c) **the two tiers** — manual paste-back (no keys, default) vs the optional **Stitch MCP** (set its API key in `aios/.env` — never paste it in chat; register the MCP; `mcp_enabled: true`), graceful-off when absent; (d) **the `design-system.md` shape** (link the template / the named sections incl. the Stitch-prompt block); (e) **the console-token mapping** — how palette HSL triplets map onto `aios/src/index.css` `:root`/`.dark` and `brand.ts` words, applied only on opt-in; (f) the **privacy note** — Stitch / the MCP sends your prompts and any uploaded screenshots to Google, on your authorized key, opt-in.

- [ ] **Step 2: Verify**

Confirm all six topics + the privacy note are present; any relative links resolve; the doc never instructs pasting a key into chat.

- [ ] **Step 3: Commit**

```bash
git add docs/DESIGN-SYSTEM.md
git commit -m "docs(define-design): Stitch workflow + design-system shape + console-token mapping + privacy"
```

---

## Task 4: Wire the sibling skills

**Files:**
- Modify: `.claude/skills/setup-project/SKILL.md`
- Modify: `.claude/skills/define-project/SKILL.md`
- Modify: `.claude/skills/what-can-i-do/SKILL.md`
- Modify: `.claude/skills/advise-project/SKILL.md`

- [ ] **Step 1: setup-project — add a design check beside the charter check**

In `.claude/skills/setup-project/SKILL.md`, right after the existing **"Charter check (do this first)"** paragraph (around line 29), add a short **"Design check"** paragraph in the same voice: if `wiki/design-system.md` is absent, offer *"Want to set how your project looks, too? (recommended) — it takes a few minutes and keeps your UI from looking generic"* → run `define-design`; if present, offer to theme the console from it. Keep it light; never collect the Stitch key. (Brand/colors there still default as today if the user declines.)

- [ ] **Step 2: define-project — closing pointer**

In `.claude/skills/define-project/SKILL.md`, in the **`## Output`** closing summary, add one line suggesting the natural next step: *"Next, let's define how it **looks** — run `define-design` to capture your design system (`wiki/design-system.md`)."*

- [ ] **Step 3: what-can-i-do — menu item**

In `.claude/skills/what-can-i-do/SKILL.md` step 1's default menu, add an item (place it right after "Get clear on your project"):
`   - **Make it look great** — set your project's design: style, colors, and feel → runs `define-design``

- [ ] **Step 4: advise-project — light signal**

In `.claude/skills/advise-project/SKILL.md` step **1. Gather signals → "Project identity"** (line 47), append that it also reads `wiki/design-system.md` when present (design direction) as part of project identity. (Optional, one clause — graceful when absent. Do NOT change the scoring, the lenses, or any propose-only invariant.)

- [ ] **Step 5: Verify**

`git grep -n "define-design" .claude/skills/setup-project/SKILL.md .claude/skills/define-project/SKILL.md .claude/skills/what-can-i-do/SKILL.md` shows the three mentions; the advise-project change is a single additive clause; no scoring/invariant text changed (`git diff .claude/skills/advise-project/SKILL.md` is a one-line addition).

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/setup-project/SKILL.md .claude/skills/define-project/SKILL.md .claude/skills/what-can-i-do/SKILL.md .claude/skills/advise-project/SKILL.md
git commit -m "feat(define-design): chain from setup-project/define-project, add to menu, feed advise-project"
```

---

## Task 5: CLAUDE.md + docs + README + spec addendum

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`

- [ ] **Step 1: Record CLAUDE.md line count**

Run: `wc -l CLAUDE.md` → expect **98** (hard cap **< 100**).

- [ ] **Step 2: Add the CLAUDE.md skill bullet + raw/design line, condensing to stay < 100**

(a) Add ONE Skills-list bullet immediately after the `define-project` entry (line 74), same `- **\`name\`** — …` format:
> `- **\`define-design\`** — interview that grills you into a **design system** (`wiki/design-system.md`, the look-and-feel north star Claude reads before building any UI): style, color, type, voice. Google Stitch–aware (manual default; optional MCP); offers to theme the console. See `docs/DESIGN-SYSTEM.md`.`

(b) Add ONE sub-bullet under the `raw/` list, right after the `raw/project/` line (line 22), naming the subfolder **and** the north star (mirroring how line 22 names `raw/project/` + `wiki/charter.md`):
> `  - `raw/design/` — `define-design` Stitch exports; the look-and-feel north star lives at `wiki/design-system.md``

(c) These add 2 lines (→100). Reclaim one by **condensing losslessly** — recommended: merge the two `## Pointers` bullets (lines 97–98) into a single line, e.g.:
> `- Design spec: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`. The AIOS console (`aios/`) is file-first — reads this KB, writes only to `outputs/`.`

Net +1 → **99 lines**. (If you condense elsewhere instead, that's fine — never drop a rule.)

- [ ] **Step 3: Verify CLAUDE.md**

Run: `wc -l CLAUDE.md` → must be **< 100**. `git grep -n "define-design" CLAUDE.md` shows the bullet; `git grep -n "raw/design" CLAUDE.md` shows the subfolder line; confirm no rule/directive was removed (only wording merged).

- [ ] **Step 4: USING-THIS-FOR-ANY-PROJECT.md**

After the **"Define it first"** paragraph (line 24), add a sibling line: *"**Then define how it looks:** run `define-design` — a design-discovery interview that captures your style, palette, and voice in `wiki/design-system.md` (the look-and-feel north star), is Google Stitch–aware, and can theme the console."* And near the optional-capability mention (the `codex-review` line ~69), add that the **Stitch MCP** is an optional capability (needs a Google AI key in `aios/.env`) → see `docs/DESIGN-SYSTEM.md`.

- [ ] **Step 5: README.md**

(a) In **"Make it your project"** (line 78), after the `define-project` sentence, add: *"Then run **[`define-design`](.claude/skills/define-design/SKILL.md)** to capture how it should *look* — a design system in `wiki/design-system.md` so your UI isn't generic."*
(b) In **"What you get"** (line 40 area), add a bullet: *"🎨 **Designed, not generic** — a guided design step (Google Stitch–aware) captures your look-and-feel so what you build looks intentional, not AI-default."*
(c) In **"Build status"** (line 110 area), the list currently stops at Phase 6 — Phases 7 and 8 were never added. Append all three so the ladder is honest:
> `- Phase 7 — optional `codex-review` cross-model code-review gate (graceful-off) ✅`
> `- Phase 8 — `define-project` discovery interview → project charter (`wiki/charter.md`) ✅`
> `- Phase 9 — `define-design` design-discovery + design system (`wiki/design-system.md`, Google Stitch–aware) ✅`

- [ ] **Step 6: Design-spec addendum**

In `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`, add a short addendum line/pointer near where prior phases are referenced: that Phase 9 (`define-design`) adds the design layer — see `docs/superpowers/specs/2026-06-30-define-design-design.md`. (One line; match how Phases 6–8 are pointed to there, if present.)

- [ ] **Step 7: Verify**

`git grep -n "define-design" CLAUDE.md docs/USING-THIS-FOR-ANY-PROJECT.md README.md docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` shows all mentions; all relative links resolve; `wc -l CLAUDE.md` still < 100.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md docs/USING-THIS-FOR-ANY-PROJECT.md README.md docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md
git commit -m "docs(define-design): pin in CLAUDE.md (<100) + USING/README mentions + spec addendum"
```

---

## Final: close-out

- [ ] **Step 1: Structural sanity (the headline properties)**

- `wc -l CLAUDE.md` < 100, with the new bullet + `raw/design/` line; no rule dropped.
- `node -e "JSON.parse(require('fs').readFileSync('.claude/skills/define-design/config.json','utf8'));console.log('ok')"` → `ok`.
- The SKILL.md covers: propose-don't-just-ask, the five dimensions + archetypes, the follow-up cap + assumption flag, the draft-confirm gate, the tiered Stitch step with manual fallback, append-only dated-folder raw write, wiki write + index cross-link, opt-in console theming (index.css + brand.ts only), change-log line, and the privacy note.

- [ ] **Step 2: No pollution / template stays generic**

- `git status` clean; **no real `wiki/design-system.md`**, **no `raw/design/<date>-…` record**, and **no console theming** committed (only `raw/design/.gitkeep`). Confirm: `git status --porcelain wiki/design-system.md` empty; `ls raw/design` shows only `.gitkeep`.
- `aios/src/index.css` and `aios/src/config/brand.ts` are **unchanged** vs `main` (`git diff --stat main -- aios/src/index.css aios/src/config/brand.ts` is empty) — the build describes theming, it does not perform it.
- `improve-system/SKILL.md` unchanged (`git diff --stat main -- .claude/skills/improve-system` is empty).
- No key anywhere (`git grep -iE "AIza|sk-" -- . ':!*.lock' || echo none` → `none`).

- [ ] **Step 3: Update memory**

Record Phase 9 (`define-design`) in `MEMORY.md` + `hma-foundation-overview.md` (what it is, the `raw/design/` → `wiki/design-system.md` → opt-in console-theme flow, Stitch tiers/graceful-off, the integration points, merged commit).

- [ ] **Step 4: Finish the branch**

Use `superpowers:finishing-a-development-branch` (there are no automated tests to run — this is authoring; the structural checks above stand in). Default to a fast-forward merge of `phase-9-define-design` into `main` to keep linear per-phase history, matching Phases 6–8. **Push only if the user explicitly asks.**

---

## Verification checklist (maps to the spec)

- [ ] `define-design` is interview-first, zero-arg, re-runnable; reads `wiki/charter.md` to recommend a direction.
- [ ] Propose-don't-just-ask across the five dimensions + the style-archetype library; 2–3 follow-up cap + `(assumed — confirm later)`; draft-confirm gate.
- [ ] Stitch step is tiered + graceful-off: manual paste-back default produces a usable system; MCP path self-skips cleanly with no key; key never requested in chat.
- [ ] Raw record is an append-only dated **folder** with real-path provenance; `wiki/design-system.md` matches `docs/WIKI-FRONTMATTER.md` + carries the Stitch-prompt block; cross-linked top/pinned in `wiki/index.md`.
- [ ] Console theming is opt-in + attended, edits only `index.css` + `brand.ts`, logged `applied`, never in the loop; `improve-system` untouched.
- [ ] Palette recorded in the `--token: H S% L%` shape that matches `aios/src/index.css`.
- [ ] Wiring present: setup-project design check, define-project pointer, what-can-i-do item, advise-project signal; `CLAUDE.md` < 100 with the bullet + `raw/design/` line; USING/README mentions; spec addendum.
- [ ] Privacy note (Stitch → Google) in the skill + `docs/DESIGN-SYSTEM.md`; key only in `aios/.env`.
- [ ] Template stays generic — only `raw/design/.gitkeep` ships; no real design system / theming committed.
