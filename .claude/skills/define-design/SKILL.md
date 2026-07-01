---
name: define-design
description: Design-discovery interview that grills the user — one question at a time, with proposed style options and a recommended default whenever they're unsure — into a portable design system at wiki/design-system.md, the look-and-feel north star Claude reads before building any UI. Google Stitch–aware (manual paste-back by default, optional Stitch MCP, graceful-off with no key). Re-runnable for a restyle/pivot, and offers to theme the AIOS console from the result. Zero-argument safe: run with no arguments and it opens the interview.
---

# define-design

The design-clarity interview. `define-project` grills the user into *what* they're building
(`wiki/charter.md`); this skill grills them into *how it should look* — a clear, portable
**design system** at `wiki/design-system.md` that any build (plugin, mobile, web, workflow,
the AIOS console) can read before generating a single screen. Without it, UI work defaults
to generic, vibe-coded slop; with it, every build anchors to the same look and feel.

It is **interview-first**: run it with no arguments and it opens the conversation.
It is **propose-don't-just-ask**: the moment an answer is thin or "I don't know," the skill
offers 2–4 concrete style options plus a recommended default — inferred from the charter and
prior answers — so the user is always picking/approving, never staring at a blank canvas.

It is **Google Stitch–aware but not Stitch-dependent**: by default it emits a ready-to-paste
Stitch prompt and distills whatever the user generates, but it produces a usable system from
the interview alone if they skip Stitch entirely. An optional Stitch MCP can automate
generation when configured; absent the key it falls back cleanly to the manual path.

## When to use

- **First design pass on a fresh clone** — after (or alongside) `define-project`, before any
  UI work, define how the project should *look*. If there's no charter yet, the skill suggests
  `define-project` first but can still proceed.
- **On a restyle or pivot** — re-run any time the look, brand, or audience materially changes.
  The skill reads the existing `wiki/design-system.md` for defaults, focuses the interview on
  what is changing, and updates the design system in place.
- **When UI work needs a consistent look** — if builds keep producing mismatched, generic
  interfaces, run `define-design` first to give every build a single look-and-feel target.

## Inputs (interview first; zero-argument safe)

No arguments needed. Run the skill and it opens the design interview immediately. Never block
waiting for a file or a config value; everything is gathered through conversation.

On a **re-run (restyle/pivot)**, read `wiki/design-system.md` before the first question so the
interview can use the existing choices as defaults and focus only on what is changing.

Read behaviour from `.claude/skills/define-design/config.json` (all optional; never block on a
missing file or key):

- **`default_archetype`** — optional pre-pick of a style archetype (`""` = infer from charter); if set,
  recommend it first in Phase 1.
- **`theme_console`** — `true` to offer the opt-in console-theming step (Phase 7); `false` to skip the offer.
- **`mcp_enabled`** — the single Stitch toggle. Default `false` = the manual paste-back Stitch path. Set
  `true` **and** put `STITCH_API_KEY` (a Google AI / Gemini key) in `aios/.env` to let Claude drive the
  Stitch MCP directly — and even then it **gracefully falls back to the manual path** if the key or MCP is
  absent at runtime.

## Procedure

### Phase 0 — Read the charter

Before the first question, read `wiki/charter.md` if it exists (project type, audience, brand
words, voice) and use it to **infer a recommended design direction** so the interview proposes
rather than asks blind — e.g. a B2B data tool leans *Professional / dashboard*, a portfolio
leans *Warm / editorial*. If the charter is absent, suggest running `define-project` first for a
sharper recommendation, but **proceed anyway** — design can stand alone.

### Phase 1 — Design interview (propose-don't-just-ask, one question per message)

#### Opening

Open warmly and set expectations in a single message before the first question. Something like:

> "I'll ask a few questions to get your project's look clear — answer however you can. If you're
> unsure about anything, I'll suggest a couple of directions and a recommendation, so you can
> pick and tweak rather than design from scratch."

#### One question at a time — five dimensions in order

Walk these five dimensions **in order, one question per message**. Never bundle multiple
questions. The moment an answer is thin, vague, or "I don't know," immediately offer **2–4
concrete options plus a recommended default** inferred from the charter and prior answers, and
let the user pick, tweak, or approve.

**1. Style direction** *(the lost-user anchor)*
Ask what overall feel they want. If they're unsure, offer the **style-archetype library** and
recommend the one that fits the charter:
- **Minimal / focused** — clean, restrained, lots of whitespace (Linear, Notion).
- **Warm / editorial** — typographic, content-forward (blogs, portfolios).
- **Bold / playful** — saturated, energetic (consumer apps).
- **Professional / dashboard** — dense, precise, data-first (B2B, analytics — the AIOS console's current look).
- **Elegant / premium** — refined, high-contrast, generous space (brand/luxury).
Recommend `default_archetype` from config if it's set; otherwise recommend the archetype that best
fits the charter. Then let them confirm or adjust.

**2. Color & mood**
Ask for a palette seed, or offer "match my logo / brand words." Recommend a mood from the
chosen archetype. Capture the result as the **HSL token triplets** defined in the Palette
contract below, so it maps 1:1 onto the console tokens.

**3. Typography & shape**
Ask about type pairing (display/body) and corner radius / density (compact ↔ airy). If vague,
propose a pairing and a `--radius` value that suit the archetype.

**4. Voice & imagery**
Ask about microcopy tone (e.g. plain and direct, warm, playful, formal) and imagery style
(illustration vs photography vs flat). Offer options tied to the archetype if they're unsure.

**5. Targets & constraints**
Ask about platforms (web / mobile / both), whether it's dark-first, contrast/accessibility
targets, and any must-keep brand marks. This is often quick; "no constraints" is a valid answer.

#### Adaptive depth and guardrails

- If an answer is clear and specific → accept it and move on.
- If it's vague → offer the 2–4 options + recommended default, and let them pick or approve.
- **Follow-up cap:** probe each dimension for at most **2–3 follow-up exchanges**. If a dimension
  is still vague after the cap, record the recommended default as an assumption flagged
  `(assumed — confirm later)` and move on. **Never trap the user in a loop.**

### Phase 2 — Stitch step (tiered, graceful-off)

**Default (no keys) — the manual paste-back path.** Assemble a **ready-to-paste Stitch prompt**
from the interview. Direct the user to `stitch.withgoogle.com`, have them generate and iterate on
the design there, then drop the export (Stitch's `design.md` plus any screenshots) into the dated
`raw/design/` folder for this run. **If the user skips
Stitch entirely, synthesize the system from the interview alone** — Stitch is an accelerator,
not a dependency.

**Optional climb (MCP).** If `mcp_enabled` is true *and* `STITCH_API_KEY` (a Google AI / Gemini key) is
present in `aios/.env` *and* the user opts in, generate or pull designs directly through the MCP and save
the result into the same `raw/design/` folder. If the key or MCP is absent, or the user
declines, **fall back cleanly to the manual path** — note the skip, never block.

**`STITCH_API_KEY` (the Stitch/Google AI key) is never collected in chat.** It lives only in `aios/.env`
(an empty slot the user fills). Do not ask for it, read it back, or write it anywhere. See
`docs/DESIGN-SYSTEM.md` for setup and the privacy note.

### Phase 3 — Draft-confirm gate

Before writing anything, reflect back a **complete draft design system** in one message — all
five dimensions, any flagged `(assumed — confirm later)` items, and a short **palette preview**
(the token triplets) — and ask: "Does this look right — anything to change before I write it up?"

Only proceed to Phase 4 after the user confirms. If they make corrections, show the updated
draft and confirm again.

### Phase 4 — Write the raw record

Save the export and interview capture under a **new dated folder**:

    raw/design/<YYYY-MM-DD>-<slug>/

where `<slug>` is a short kebab-case label for the design (e.g. `calm-dashboard`). Put any
Stitch export files (its `design.md`, screenshots, exported code) in the folder, plus a
**distilled capture file** carrying the standard frontmatter:

```markdown
---
title: Design Discovery — <YYYY-MM-DD>
source_id: raw/design/<YYYY-MM-DD>-<slug>/capture.md
path: raw/design/<YYYY-MM-DD>-<slug>/
tags: [design, discovery, interview]
updated: <YYYY-MM-DD>
---
```

**Append-only rule:** each run (including restyle re-runs) writes a **new** dated folder. Never
edit or overwrite anything already in `raw/`. If today already has a folder for this design, use
a disambiguating suffix (e.g. `<YYYY-MM-DD>-<slug>-2/`).

**Use the real folder path everywhere.** The `<YYYY-MM-DD>-<slug>/` shown in the templates is a
placeholder — wherever the actual record is referenced (this capture's `source_id`/`path`
frontmatter, the design system's *Source* footer, and the `change-log.md` line), use the **exact
folder path you wrote this run, including any disambiguating suffix**, so a same-day restyle's
provenance points at the new record, not the first one.

### Phase 5 — Write or update wiki/design-system.md

Write (first run) or update in place (re-run) the design system at `wiki/design-system.md` using
the template in "The design system (wiki/design-system.md) shape" below.

This is normal AI wiki maintenance and writes to `wiki/` directly — no sign-off needed.

On a re-run: update the content, bump `updated:` to today, and append a link to the new raw
record at the bottom alongside any prior ones.

### Phase 6 — Cross-link from wiki/index.md

Add or maintain an entry for `wiki/design-system.md` in `wiki/index.md`:
- Under the "By area" section, as a **top or pinned entry** (the design system is a north star,
  like the charter — it belongs at or near the top, not buried).
- Under "Recent additions" with today's date.

Follow the same cross-linking pattern `add-new-resource` uses when indexing any asset.

### Phase 7 — Offer console theming (opt-in, approved)

If `theme_console` is enabled, ask whether to apply the design to the AIOS console now. **Only on
an explicit yes**, edit exactly two files — never more:

- **`aios/src/index.css`** — regenerate the `:root` (light) and `.dark` HSL color tokens from the
  design system's palette. This is **new logic**: **preserve the file's comments and structure,
  changing only the token *values*** (the `--token: H S% L%` triplets). When applying, also
  re-derive and sanity-check the **paired contrast tokens** against the new palette — the
  `*-foreground` pairs (`--primary-foreground`, `--secondary-foreground`, `--accent-foreground`,
  `--muted-foreground`, `--card-foreground`, `--destructive-foreground`) plus
  `--popover` / `--popover-foreground` — so text stays legible on every surface after a strong palette
  change.
- **`aios/src/config/brand.ts`** — update `productName` / `tagline` / the assistant words **only
  if** the voice changed.

This is the same attended, user-approved, logged config-edit pattern `setup-project` uses for
`aios/` source — **never** an autonomous structural change, and **never** done in the unattended
`maintenance-loop`. If the user declines, skip it and write nothing to `aios/`.

### Phase 8 — Log the change

Append one attributed line to `outputs/change-log.md`:

    - <YYYY-MM-DD> — define-design — wrote design system (wiki/design-system.md) from raw/design/<YYYY-MM-DD>-<slug>/[; themed aios console] — auto|applied

Use `applied` (and include the `; themed aios console` clause) when the console was themed, since
that touched project source; otherwise use `auto` and drop the clause.

---

## The design system (wiki/design-system.md) shape

Every design system uses this exact template. Fill in every section; use
`(assumed — confirm later)` for anything the user left unresolved.

**Palette contract.** Record colors as **HSL token triplets in the exact shape
`aios/src/index.css` uses** — `--primary: H S% L%` (space-separated, **no `hsl()` wrapper**) —
for both `:root` (light) and `.dark`, covering: `background`, `foreground`, `card`, `primary`,
`secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`.
This maps 1:1 onto the console tokens so Phase 7 can regenerate them with no translation.

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

---

## Safety invariants

- **`raw/design/` is immutable / append-only.** Stitch exports and capture files are ground
  truth; write **new dated folders only**, never edit, overwrite, rename, or delete existing ones.
- **`wiki/design-system.md` is normal AI wiki maintenance** — written directly to `wiki/` (like
  `charter.md`), no sign-off needed.
- **Console theming is opt-in, attended, and logged.** It edits **only** `aios/src/index.css`
  (regenerating token values, preserving comments/structure) and `aios/src/config/brand.ts`,
  **only on an explicit user yes**, and logs an `applied` change-log line. It touches no other
  source and **never runs in the unattended `maintenance-loop`**.
- **Never collect, read back, or write `STITCH_API_KEY` (the Stitch / Google AI key).** It lives only in
  `aios/.env` (an empty slot the user fills). Do not request it in chat.
- **`improve-system` is untouched.** It remains the single applier / single `change-log.md`
  writer for the self-improvement lanes; `define-design`'s own attended change-log lines mirror
  how `define-project` and `setup-project` log their own attended writes.
- **Privacy.** Using Google Stitch or the Stitch MCP **sends your prompt — and any uploaded
  screenshots — to Google.** It is opt-in and runs on the user's own authorized key. State this
  before the user generates anything; full note in `docs/DESIGN-SYSTEM.md`.

---

## Output

End the session with a short summary:

- Confirmation that the raw record folder `raw/design/<YYYY-MM-DD>-<slug>/` was written
  (immutable Stitch export + interview capture).
- Confirmation that `wiki/design-system.md` was created or updated (the distilled look-and-feel
  north star).
- Any entries cross-linked in `wiki/index.md`.
- The `change-log.md` line appended.
- Whether the AIOS console was themed (`index.css` + `brand.ts`) or left untouched.
- A reminder of any items flagged `(assumed — confirm later)` that the user should revisit.

Example:

> Design system written.
> - Raw record: raw/design/2026-06-30-calm-dashboard/
> - Design system: wiki/design-system.md (created)
> - Indexed in wiki/index.md (pinned under "By area", added to "Recent additions")
> - Logged to outputs/change-log.md
> - Console: not themed (you can re-run and say yes any time)
>
> 2 items marked "assumed — confirm later": exact body typeface; mobile contrast target.
> Re-run define-design any time you want a restyle or those assumptions resolve.

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, do **not** open your interview or draft-confirm gate —
`autopilot` owns the single confirm gate. Infer the design direction from the confirmed
`outputs/autopilot/<date>-<slug>/plan.md` (which carries any tweak made at the confirm gate) +
`wiki/charter.md` + the design answers in `intake.md`, pick your **recommended defaults** (the archetype
library + token derivation), flag each `(assumed — confirm later)` AND report it to `autopilot` for the
ledger, then write `wiki/design-system.md` + `raw/design/<date>-<slug>/` exactly as attended. Synthesize
from those inputs alone — do **not** wait on a Stitch paste-back (use the MCP only if already configured),
and **never run console-theming** (that stays opt-in attended). This note is additive — your attended
behavior above is unchanged; `autopilot` is user-initiated and never part of the unattended
`maintenance-loop`.
