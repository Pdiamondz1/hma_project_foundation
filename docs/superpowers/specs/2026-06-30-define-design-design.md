# Design Spec: `define-design` — a design-discovery skill that grills the user into a portable design system (Google Stitch–aware)

> Status: Approved (2026-06-30). Not yet implemented. A new capability layered on the
> foundation (Phases 0–8). Call it **Phase 9**. Interview-first and attended (like
> `define-project`/`setup-project`), not part of the unattended loop. Graceful-off: a clone
> with no Google Stitch / no API key uses the manual paste-back path and is otherwise unchanged.

## Context

**Why this is being built.** The foundation grills the user into **what** they're building
(`define-project` → `wiki/charter.md`) but ships **no artifact for how it should look**. So when
Claude builds any UI for the user's project, it defaults to generic, vibe-coded "AI slop" — the
single most-forgotten part of a build for non-technical users. We want a **design layer** that
removes the user as the design bottleneck: if they can't articulate a look, the skill proposes
curated directions and recommends one, then captures a **portable design system** any build
(plugin, mobile, web, workflow, AIOS) can consume.

**The paradigm we're adopting (from the user's reference video — "Google Stitch + Claude Code =
Insane App Design," Build Great Products).** Google Stitch generates polished UI from natural
language (or from screenshots of a rough app) and emits a **`DESIGN.md`** — a markdown file that
encodes the *design system* (palette, typography, spacing, components, voice). You copy that file
into the project and **Claude Code builds UI that matches it**; an optional **Google Stitch MCP**
(API key) lets Claude pull the *exact* screen layout. The reframe for us: **`wiki/design-system.md`
is to design what `wiki/charter.md` is to purpose** — the look-and-feel north star, written by AI,
read by the whole system.

**Decisions (made with the user this session):**
1. **Form factor → a new standalone skill, `define-design`** (sibling of `define-project`):
   zero-arg, interview-first, re-runnable for a restyle/pivot. (Rejected: folding into
   `setup-project`; a docs-only `DESIGN.md` template.)
2. **Stitch depth → both, manual-first.** Default needs **no keys**: the skill emits a ready-to-paste
   Stitch prompt + a `DESIGN.md` scaffold; the user generates at `stitch.withgoogle.com` and drops
   the export back; the skill distills it. **Optional climb:** wire the **Stitch MCP** (API key in
   `aios/.env`, never collected in chat, graceful-off) so Claude Code generates/pulls designs
   directly. Mirrors the Tier ladder + `codex-review`. (Rejected: MCP-first; manual-only.)
3. **Apply target → portable spec + opt-in console theming.** Always write the portable
   `wiki/design-system.md` (the north star any UI reads). Then **offer**, with explicit approval, to
   apply it to the AIOS console by regenerating the `aios/src/index.css` color tokens + `brand.ts`
   words, so the user sees their design **live immediately**. Application is opt-in, never automatic.
   (Rejected: portable-spec-only; console-theming-only.)

**Intended outcome.** A fresh clone's design step: run `define-design`, get grilled (with proposed
style directions when you're unsure) into a clear design system, captured as
`wiki/design-system.md` and grounded in immutable Stitch exports under `raw/design/`. Claude reads
it before generating any UI; optionally it themes the console on the spot; optionally the Stitch
MCP automates generation. Skip Stitch entirely and the manual path still produces a usable system.

## Architecture

A new attended, interview-first skill that writes through the existing **raw → wiki → (opt-in)
apply** pipeline. No new conventions; the Stitch workflow slots into the three-folder system.

```
                              ┌─────────────────────────────┐
  "define my design" ───────▶│        define-design        │
  (you, attended)            │  0. read wiki/charter.md     │  ← infer + recommend a direction
  setup-project / ───────────▶│  1. design interview         │     (propose-don't-just-ask)
  define-project / menu      │     (style→color→type→voice  │
                             │      →targets/constraints)   │
                             │  2. Stitch step (tiered):    │
   stitch.withgoogle.com ◀───┤     manual prompt OR MCP     │──▶ raw/design/<date>-…/  (immutable
   (or Stitch MCP, opt-in)──▶│  3. draft-confirm gate       │      Stitch export = ground truth)
                             │  4. distill design system    │──▶ wiki/design-system.md (north star,
                             │  5. cross-link wiki/index.md │      RAG-frontmatter, + Stitch prompt)
                             │  6. OFFER console theming     │──▶ aios/src/index.css + brand.ts
                             │  7. log change                │      (opt-in, approved, like setup-project)
                             └─────────────────────────────┘──▶ outputs/change-log.md
```

**Parts, reusing existing patterns:**
1. **`define-design` skill** *(new)* — the interview + capture + opt-in apply. Mirrors
   `define-project` house style (frontmatter `name`+`description`; `When to use` / `Inputs
   (interview first; zero-argument safe)` / `Procedure` / `Output`).
2. **`raw/design/`** *(new dir)* — immutable, append-only Stitch exports (the `design.md` Stitch
   emits, screenshots, any exported code). Each run drops a new dated set; never mutated.
3. **`wiki/design-system.md`** *(written at runtime, not shipped)* — the distilled north star.
4. **Opt-in console theming** — regenerate `aios/src/index.css` color tokens (the file is documented
   as the re-theme surface but **no skill regenerates it today**, so this is new logic) + the
   `aios/src/config/brand.ts` words (which `setup-project` also edits), only on an explicit
   in-interview yes — the same attended, user-approved, logged config-edit pattern `setup-project`
   uses for `aios/` source.
5. **`.claude/skills/define-design/config.json`** *(new)* + **`docs/DESIGN-SYSTEM.md`** *(new)* —
   config + the Stitch/MCP setup, the `DESIGN.md` shape, and the privacy note.

## The `define-design` skill

Zero-argument, interview-first, attended (never runs unattended in `maintenance-loop`).
Re-runnable: on a restyle/pivot it reads the current `wiki/design-system.md` for defaults and
focuses the interview on what's changing.

### Procedure

**Phase 0 — Read the charter.** Before the first question, read `wiki/charter.md` if present
(project type, audience, brand words, voice). Use it to **infer a recommended design direction** so
the interview proposes rather than asks blind. If absent, suggest running `define-project` first,
but proceed (design can stand alone).

**Phase 1 — Design interview (propose-don't-just-ask, one question per message).** Open warmly and
set expectations ("if you're unsure, I'll suggest directions and a recommendation — pick and
tweak"). Walk these dimensions in order; the moment an answer is thin or "I don't know," offer 2–4
concrete options + a recommended default inferred from the charter/prior answers:

1. **Style direction** *(the lost-user anchor)* — offer a curated **style-archetype library**,
   recommending the one that fits the charter:
   - *Minimal / focused* (Linear, Notion) · *Warm / editorial* (content, portfolios) ·
     *Bold / playful* (consumer) · *Professional / dashboard* (B2B, data, AIOS — the console's
     current look) · *Elegant / premium* (brand/luxury).
2. **Color & mood** — seed a palette, or "match my logo / brand words"; recommend from the archetype.
   Captured as HSL token triplets that map 1:1 onto `index.css` (`--primary`, `--secondary`, …).
3. **Typography & shape** — type pairing + corner radius / density (compact ↔ airy); recommend defaults.
4. **Voice & imagery** — microcopy tone; illustration vs photography vs flat.
5. **Targets & constraints** — web / mobile / both; dark-first?; accessibility (contrast targets);
   must-keep brand marks.

**Guardrails (identical discipline to `define-project`):** 2–3 follow-up cap per dimension; record
the recommended default flagged `(assumed — confirm later)` when still vague; never loop.

**Phase 2 — Stitch step (tiered, graceful-off).**
- **Default (no keys):** emit a **ready-to-paste Stitch prompt** assembled from the interview, plus
  a `DESIGN.md` scaffold. Direct the user to `stitch.withgoogle.com`, have them generate + iterate,
  then drop the export (Stitch's `design.md` + screenshots) into `raw/design/<date>-…/`. If the user
  skips Stitch entirely, synthesize the system from the interview alone (Stitch is an *accelerator,
  not a dependency*).
- **Optional climb (MCP):** if the Stitch MCP is configured (its API key present in `aios/.env`) and
  the user opts in, Claude generates/pulls designs directly and saves the result into
  `raw/design/<date>-…/`. Absent key or MCP → **cleanly fall back to the manual path** (log the skip;
  never block). The key is **never collected in chat**.

**Phase 3 — Draft-confirm gate.** Reflect back a complete **draft design system** (all dimensions +
flagged assumptions + a palette preview) in one message; only proceed on confirmation (or revise and
re-confirm).

**Phase 4 — Write the raw record.** Save the Stitch export / interview capture under a **dated
folder** `raw/design/<YYYY-MM-DD>-<slug>/` (the export files + a distilled capture file carrying the
standard frontmatter), append-only. Each run (incl. re-runs) writes a **new** dated folder; never
mutate existing files. If today already has a folder, use a disambiguating suffix
(e.g. `-<slug>-2/`). **Use the real path everywhere** it's referenced (frontmatter
`source_id`/`path`, the design-system footer, the change-log line), including any same-day suffix —
same provenance rule as `define-project`.

**Phase 5 — Write/update `wiki/design-system.md`.** Create (first run) or update in place (re-run)
the north star using the shape below; bump `updated:`; on a re-run append a link to the new raw
record alongside priors. Normal AI wiki maintenance — writes to `wiki/` directly, no sign-off.

**Phase 6 — Cross-link `wiki/index.md`.** Add/maintain a **top/pinned** entry under "By area" (the
design system is a north star, like the charter) and a "Recent additions" line, same pattern
`add-new-resource` uses.

**Phase 7 — Offer console theming (opt-in, approved).** Ask whether to apply the design to the AIOS
console now. **Only on an explicit yes**, edit `aios/src/index.css` (regenerate the `:root`/`.dark`
HSL color tokens from the design system's palette — `index.css` is documented as the re-theme
surface, but **no skill regenerates it today, so this is new logic** the plan must build, not a
setup-project routine to reuse) and `aios/src/config/brand.ts` (productName / tagline / assistant
words if the design changed voice — `setup-project` already edits this file). This is the same
attended, user-approved, logged config-edit pattern `setup-project` uses for `aios/` source —
**never** an autonomous structural change, and **never** done in the unattended loop. Preserve each
file's comments/shape; change only the token values + brand words.

**Phase 8 — Log the change.** Append one attributed line to `outputs/change-log.md`:
`- <date> — define-design — wrote design system (wiki/design-system.md) from raw/design/<path>[; themed aios console] — auto|applied`
(`applied` when the console was themed, since that touched project source).

### The `wiki/design-system.md` shape

```markdown
---
title: Design System
source_id: wiki:design-system
path: wiki/design-system.md
tags: [design, design-system, ui, brand, meta]
updated: <YYYY-MM-DD>
---

# Design System

**Direction:** <one line — the chosen archetype + the feeling, e.g. "Professional dashboard, calm and precise">

## Palette
<HSL token triplets that map onto aios/src/index.css — primary, secondary, background, foreground,
muted, accent, destructive, success, warning, border — for both light (:root) and dark (.dark).>

## Typography & shape
<Type pairing (display/body), weights, --radius, density.>

## Components & layout
<Buttons, cards, inputs, nav patterns; spacing scale; elevation/shadow; motion notes.>

## Voice & imagery
<Microcopy tone; illustration/photo/flat; iconography.>

## Accessibility & targets
<Contrast targets, dark-first?, web/mobile/both, any must-keep brand marks.>

## Stitch prompt
<The ready-to-paste prompt that regenerates/iterates this system in Google Stitch.>

## Open questions / assumptions
<Anything flagged "assumed — confirm later".>

---
*Source: raw/design/<YYYY-MM-DD>-…/ (Google Stitch export + discovery interview).*
```

### Safety invariants
- **`raw/design/` is immutable / append-only** — Stitch exports are ground truth; new dated sets
  only, never edits.
- **`wiki/design-system.md` is normal AI wiki maintenance** (writes directly, like `charter.md`).
- **Console theming is opt-in + attended** — edits only `aios/src/index.css` (new token-regeneration
  logic; the documented re-theme surface) + `aios/src/config/brand.ts` (also edited by `setup-project`),
  only on explicit user yes; same attended config-edit pattern as `setup-project`; logged to
  `change-log.md`; never in the loop.
- **Never** collects/reads back/writes the Stitch (Google AI) API key — it lives in `aios/.env`,
  empty slot with a comment, user fills it.
- **`improve-system` is untouched** — it remains the single applier / single `change-log.md` writer
  for the *self-improvement* lanes; `define-design`'s own attended change-log lines mirror how
  `define-project`/`setup-project` log their own attended writes.
- **Privacy (documented):** using Google Stitch / the Stitch MCP **sends your prompt (and any
  uploaded screenshots) to Google.** Opt-in, on the user's authorized key. Stated in
  `docs/DESIGN-SYSTEM.md` and the skill.

## Wiring & configuration

- **`setup-project`** — after its existing charter check, add a parallel **design check**: if
  `wiki/design-system.md` is absent, offer `define-design`; if present, offer to theme the console
  from it. Keep it light; never collect the Stitch key.
- **`define-project`** — closing suggestion points to `define-design` as the natural next step
  ("now let's define how it *looks*").
- **`what-can-i-do`** — add a plain-language menu item: *"Make it look great — set your design →
  runs `define-design`."*
- **`advise-project`** *(light)* — when `wiki/design-system.md` is absent, it may surface a
  "define your design" idea (propose-only, as today); when present, it's available as a signal.
- **`CLAUDE.md`** — add one Skills-list bullet for `define-design` and a one-line pointer that the
  look-and-feel north star is `wiki/design-system.md` (read before generating any UI), plus the new
  `raw/design/` subfolder in the three-folder section. Must stay **< 100 lines** — the file is at
  **98 today**, so the plan must **budget for condensing existing wording** (per CLAUDE.md's own
  maintenance policy: *"Condense wording, never a rule; raise the line cap before dropping a
  directive"*) to absorb these additions rather than blindly append; note the still-pending
  `codex-review` spec also wants +1 line, so condense generously. Per the maintenance policy, detail
  (Stitch tiers, MCP setup, `DESIGN.md` shape, privacy) lives in `docs/DESIGN-SYSTEM.md`.
- **`.claude/skills/define-design/config.json`** — `stitch_mode` ("manual" default | "mcp"),
  `default_archetype` (""), `theme_console` (true = offer the apply step), `mcp_enabled` (false;
  graceful-off self-skips if no key).
- **`docs/DESIGN-SYSTEM.md`** *(new)* — the Stitch workflow, MCP + key setup (key in `aios/.env`,
  never in chat), the `DESIGN.md`/`design-system.md` shape, the console-token mapping, and the
  privacy note.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — add `define-design` to the "define it first" /
  specialize sequence; **`README.md`** — one line that an early step is defining your design.

## Files

**Create:** `.claude/skills/define-design/SKILL.md`, `.claude/skills/define-design/config.json`,
`raw/design/.gitkeep`, `docs/DESIGN-SYSTEM.md`.

(`wiki/design-system.md` and `raw/design/<date>-…` are written by the skill **at runtime**, not
shipped — the template ships with no design system, like the rest of the empty KB.)

**Modify:** `.claude/skills/setup-project/SKILL.md` (design check + offer),
`.claude/skills/define-project/SKILL.md` (closing pointer),
`.claude/skills/what-can-i-do/SKILL.md` (menu item),
`.claude/skills/advise-project/SKILL.md` (light signal/idea),
`CLAUDE.md` (skill bullet + `raw/design/` + design-system pointer; < 100 lines),
`docs/USING-THIS-FOR-ANY-PROJECT.md` + `README.md` (one-line mentions),
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` (short addendum pointer).

## Verification

- **Authoring sanity:** every path the skill names matches reality — the raw→wiki pattern
  (`raw/design/<date>-…` + a `wiki/` page with `docs/WIKI-FRONTMATTER.md` frontmatter + a
  cross-link from `wiki/index.md`), the change-log line format, the `index.css` HSL-token shape
  (`--primary: H S% L%`, `:root`/`.dark`), and `brand.ts` fields.
- **Structural checks (no real run against this repo):** this repo IS the template — do **not**
  conduct a real design interview or write a `wiki/design-system.md` / `raw/design/*` here. Verify
  the SKILL.md covers: charter-read inference, propose-don't-just-ask, the five dimensions, the
  style-archetype library, the 2–3 follow-up cap + `(assumed — confirm later)`, the draft-confirm
  gate, the tiered Stitch step with manual fallback, the append-only raw write with real-path
  provenance, the wiki write + index cross-link, the **opt-in** console-theming step, and the
  change-log line.
- **Graceful-off (no Stitch / no key — the default test path):** the manual paste-back path produces
  a usable `wiki/design-system.md`; the MCP path self-skips cleanly with a logged note; nothing
  blocks; the Stitch key is never requested in chat.
- **Console theming is opt-in:** the skill only edits `index.css` + `brand.ts` on an explicit yes,
  preserves their comments/shape, and logs an `applied` change-log line; it touches no other source.
- **Design-system shape:** `wiki/design-system.md` frontmatter validates against
  `docs/WIKI-FRONTMATTER.md` and carries the documented sections incl. the Stitch-prompt block.
- **Integration:** `setup-project` offers/uses it; `define-project` points to it; `what-can-i-do`
  shows the item; `advise-project` degrades gracefully when absent; `wc -l CLAUDE.md` < 100 with the
  new bullet + pointer + `raw/design/` note (condensing existing wording as needed to stay under the
  cap, never dropping a rule); README/USING mention it; the design-spec addendum points here.
- **No pollution:** `git status` clean aside from the intended files; no real
  `raw/design/*` or `wiki/design-system.md` committed (only `raw/design/.gitkeep`).

## Out of scope (v1)

- An in-console **design editor / live Stitch embed** (the console just *reads*
  `wiki/design-system.md`; a read-only "Design" panel or a token preview could come later — the seam
  is open).
- **Generating the user's downstream app UI code** — `define-design` produces the *system*; building
  UIs from it is the normal build loop (Claude reads the north star).
- **Auto-theming the console** without approval, or theming during the unattended loop.
- A **provider-agnostic design backend** — the design is Google Stitch–aware; other tools (Figma
  Make, v0, etc.) are future work, though the manual `DESIGN.md` capture is already tool-neutral.
- Any change to `raw/` immutability or the approval discipline.
