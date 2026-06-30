# Design Spec: Idea Vetting — embed `roast` + `storm-research` as a vet-before-you-build gate

> Status: Approved (2026-06-30). Not yet implemented. A new capability layered on the foundation
> (Phases 0–9). Call it **Phase 10**. Two attended, interview-first skills + a wiring gate. Tier 0
> for `roast`; `storm-research` needs the built-in web tools and **refuses rather than fabricates**
> when they're absent. No API keys.

## Context

**Why this is being built.** The foundation now grills a vague, non-technical user into *what*
they're building (`define-project` → `wiki/charter.md`) and *how it should look* (`define-design` →
`wiki/design-system.md`). But **nothing challenges the idea before they build it** — the single
biggest way a non-technical user wastes time is committing to an unvetted idea. The user wants the
idea **pressure-tested, validated, and backed by verified evidence** first, with the result saved to
the knowledge base.

**The source material (provenance).** Two skill packages the user supplied, embedded faithfully and
credited in `docs/IDEA-VETTING.md`:
- `Roast-skill/` — `roast-SKILL.md` (video `https://youtu.be/iTY8Q449YNQ`); a bonus
  `session-handoff-SKILL.md` ships in that folder but is **out of scope**.
- `Storm-research/` — `storm-research-SKILL.md` + `storm-research-report-template.html`
  (video `https://youtu.be/Tj3018n5MVg`).

**Decisions (made with the user this session):**
1. **Integration → two embedded skills, `roast` orchestrates `storm-research`.** `roast` is the front
   door (council + verdict); it can commission a `storm-research` briefing as the verified evidence
   layer and the Judge folds it in. `storm-research` also runs standalone for any topic. (Rejected: a
   single unified "vet-idea" skill; two fully independent skills with no orchestration.)
2. **Persistence → `outputs/vetting/<date>-<slug>/` + a `wiki/vetting.md` index.** Both the roast
   verdict (markdown) and the storm HTML save to the KB; the wiki page indexes vetted ideas.
3. **Wiring → `define-project` gate + `what-can-i-do` menu + `CLAUDE.md` (+ a light `advise-project`
   touch).** (Rejected: standalone-only; deep wiring into setup-project too.)
4. **`CLAUDE.md` line cap raised from `<100` to `<125`** (user-approved breathing room).

**Intended outcome.** A fresh clone's idea no longer goes straight to build: it gets roasted (a
brutal council verdict + the cheapest 48-hour test) and, on request, a verified multi-perspective
briefing — both saved to `outputs/vetting/` and indexed in `wiki/vetting.md` — so the user spends
time only on ideas that survived scrutiny.

## Architecture

Two attended, interview-first skills that write generated artifacts to `outputs/` and index them in
`wiki/` — reusing the three-folder pipeline; no new conventions.

```
                            ┌───────────────────────────────┐
  "/roast <idea>" ─────────▶│             roast             │
  "convene the council"     │  1. brief (args or 4 Qs)      │
  "brutal second opinion"   │  2. council: 5 personas ║║║║║ │  (parallel general-purpose agents)
  define-project gate ─────▶│  3. Judge → GO/RESHAPE/KILL   │──▶ outputs/vetting/<date>-<slug>/
                            │     + cheapest 48-hour test   │       roast-verdict.md  (+ change-log)
                            │  4. OFFER deep briefing ──────┼──▶ storm-research (if web + opt-in)
                            └───────────────────────────────┘
                            ┌───────────────────────────────┐
  "storm research <topic>"─▶│         storm-research        │
  (standalone or from roast)│  0. web guard (refuse if none)│
                            │  1. 5 lenses ║║║║║ (web)       │  (parallel)
                            │  2. contradiction map         │
                            │  3. clone template → HTML     │──▶ outputs/vetting/<date>-<slug>/
                            │  4. self-review + verify ║║║║ │       <slug>-briefing.html
                            └───────────────────────────────┘──▶ wiki/vetting.md (index) + change-log
```

**Parts, reusing existing patterns:**
1. **`roast` skill** *(new)* — the council + Judge, adapted to persist its verdict and orchestrate
   `storm-research`. Mirrors the source `roast-SKILL.md`.
2. **`storm-research` skill + HTML template** *(new)* — the STORM pipeline, adapted to write into the
   KB and to refuse-don't-fabricate offline.
3. **`outputs/vetting/`** *(new dir)* — the generated vetting artifacts (verdicts + briefings).
4. **`wiki/vetting.md`** *(written at runtime, not shipped)* — the AI-written index of vetted ideas.
5. **`docs/IDEA-VETTING.md`** *(new)* — the detail-holder (design, web requirement, provenance).

## The `roast` skill

`.claude/skills/roast/SKILL.md` — embed `roast-SKILL.md` faithfully: frontmatter `name: roast` +
`argument-hint: "[the idea to roast]"`; the trigger list (incl. `/roast`, "convene the council",
"brutal/second opinion", "pressure/stress-test", "validate this business idea"); **Step 1** brief
(use `$ARGUMENTS` or ask the 4 questions — the idea, who-for + money, the edge, constraints);
**Step 2** the five personas spun up **in parallel in one message** (Contrarian / Expansionist /
Logician / Researcher [web] / Buyer), each returning a stance, 3–5 points, the one must-hear thing,
and a 1–10 score; **Step 3** the running agent is the **Judge** (not a 6th agent) → the exact verdict
template (GO/RESHAPE/KILL · confidence · one-line call · why · biggest risk · biggest upside · money
read · the cheapest 48-hour test · the RESHAPE pivot) + the one-line council scores. Keep the rules
(personas don't hedge; the Judge must make a real call; the 48-hour test is the payoff).

**Three template-fit adaptations (the only deltas from the source):**
1. **Persist the verdict.** After the Judge delivers (and shows it in chat), ALSO write the brief +
   verdict + the five scores to `outputs/vetting/<YYYY-MM-DD>-<slug>/roast-verdict.md` (markdown with
   RAG-frontmatter — `title`/`source_id`/`path`/`tags`/`updated`), derive `<slug>` from the idea
   (same-day reruns suffix `-2`), update `wiki/vetting.md`, and append one attributed `change-log.md`
   line. **Use the real folder path everywhere it's referenced** (provenance rule, as in
   `define-project`/`define-design`).
2. **Orchestrate `storm-research`.** After the council (or when the user explicitly wants the deep
   briefing), OFFER: *"Want the deep, citation-verified briefing backing this? (runs `storm-research`,
   a few minutes, needs web access)."* On yes **and web available** → run `storm-research` on the idea
   so its HTML lands in the **same** `outputs/vetting/<date>-<slug>/` folder → the Judge folds the
   briefing's findings/contradictions into (or appends them to) the verdict.
3. **Graceful-off.** The Researcher persona degrades to reasoning-only when web is unavailable (its
   existing design); the storm offer is skipped with a one-line note when web is unavailable.

Zero-argument safe (no args → ask the brief questions). No API keys; nothing collected in chat.

## The `storm-research` skill

`.claude/skills/storm-research/{SKILL.md, storm-research-report-template.html}` — embed
`storm-research-SKILL.md` + its HTML template faithfully: the 4-phase pipeline (5 expert lenses —
Practitioner / Academic / Skeptic / Economist / Historian — in **parallel** with their exact return
contracts → contradiction map → **clone the template, keep its `<style>` verbatim**, fill every
section → adversarial self-review + **parallel primary-source citation verification** with
CONFIRMED / PARTIALLY CONFIRMED / UNVERIFIED / FALSE verdicts, corrections applied, and the
verification banner `N verified, X fabricated, Y corrected, Z demoted`). Keep the never-fabricate
rules (no invented studies/numbers/URLs; verify against the primary source, not a blog summary).

**Two template-fit adaptations (the only deltas from the source):**
1. **Output path → the KB.** Write the final briefing to
   `outputs/vetting/<YYYY-MM-DD>-<slug>/<slug>-briefing.html` (remap from the source default
   `storm-reports/`), update `wiki/vetting.md`, and append one attributed `change-log.md` line. Keep
   the **best-effort** auto-open (`start "" <path>` on Windows) — never block on it.
2. **Graceful-off web guard (critical).** `storm-research` REQUIRES the built-in web tools
   (WebSearch/WebFetch; no key). Add an explicit **Phase 0 guard**: if web access is unavailable,
   **STOP and say so** ("storm-research needs web access to find and verify primary sources —
   unavailable now; try again with web, or use `roast` for a reasoning-only take") rather than
   inventing sources. This upholds the foundation's never-fabricate ethos.

Zero-argument safe (accepts a `[topic]` or asks one line; one-line scoping only).

## Persistence & the KB

- **Ships:** `outputs/vetting/.gitkeep` only — the template stays generic (no real verdicts/briefings).
- **Per run:** `outputs/vetting/<YYYY-MM-DD>-<slug>/` holding `roast-verdict.md` (if roasted) and/or
  `<slug>-briefing.html` (if storm ran). A new dated folder per run; same-day reruns suffix; the raw
  artifacts are append-only in spirit (a re-vet writes a new folder).
- **`wiki/vetting.md`** *(new, AI-written, RAG-frontmatter; written by the skills when they produce an
  artifact — normal wiki maintenance, no sign-off)* — indexes vetted ideas: idea · date · verdict
  (GO/RESHAPE/KILL) · links to the artifacts. Cross-linked top/pinned under "By area" in
  `wiki/index.md` + a "Recent additions" line.
- **`outputs/change-log.md`** — one attributed line per run (`roast` or `storm-research`, `auto`).

## Wiring (the gate)

- **`define-project`** — at the **draft-confirm gate** (end of Phase 1, before Phase 2 writes the
  charter), add an optional step: *"Before we lock this in, want a brutal second opinion on the core
  idea? (runs `roast`)."* On yes → run `roast`; then record a one-line **`## Vetting`** section in the
  charter template (the verdict + the `outputs/vetting/<slug>/` path). Declining is fine — the skill
  works exactly as today.
- **`what-can-i-do`** — new menu item: *"Pressure-test an idea — get a brutal second opinion before
  you build → runs `roast`."*
- **`advise-project`** *(light)* — one additive clause: a high-weight idea may be `roast`ed before it
  is promoted to a brief. **No change** to scoring, lenses, or the propose-only invariants.
- **`CLAUDE.md`** — add two Skills bullets (`roast`, `storm-research`); add `outputs/vetting/` to the
  `outputs/` section and note `wiki/vetting.md`; **raise the "Maintaining this file" cap from `<100`
  to `<125` lines** and keep the file under 125. Detail lives in `docs/IDEA-VETTING.md`.
- **`docs/IDEA-VETTING.md`** *(new)* — the council/lens design, the storm pipeline, the **web
  requirement + graceful-off**, where artifacts land, the "vet before you build" workflow, and
  provenance/credit (the source packages + the two video links). **`README.md` /
  `docs/USING-THIS-FOR-ANY-PROJECT.md`** — short mentions (a vetting step in the sequence; storm/web
  as an optional capability). **`docs/superpowers/specs/2026-06-29-…-design.md`** — a Phase 10
  addendum pointer.

## Graceful-off / keys / tiers

- **`roast`** runs at **Tier 0** — no web, no keys (the Researcher reasons without sources; the rest
  is reasoning + the user's context).
- **`storm-research`** needs the **built-in web tools** (no API key) and **refuses rather than
  fabricates** when they're unavailable; the `roast`→`storm` offer is gated on web availability.
- **No API keys are ever collected in chat.** Both skills spawn parallel subagents (council / lenses /
  citation verifiers) — that is their core mechanic and is expected; the Judge / contradiction map are
  done inline by the running agent, not extra agents.

## Files

**Create:** `.claude/skills/roast/SKILL.md`, `.claude/skills/storm-research/SKILL.md`,
`.claude/skills/storm-research/storm-research-report-template.html`, `outputs/vetting/.gitkeep`,
`docs/IDEA-VETTING.md`.
(`wiki/vetting.md` and `outputs/vetting/<date>-<slug>/…` are written by the skills at runtime, not
shipped.)

**Modify:** `.claude/skills/define-project/SKILL.md` (roast gate at the draft-confirm step + a charter
`## Vetting` line), `.claude/skills/what-can-i-do/SKILL.md` (menu item),
`.claude/skills/advise-project/SKILL.md` (one light clause), `CLAUDE.md` (two bullets +
`outputs/vetting/` note + cap → `<125`), `docs/USING-THIS-FOR-ANY-PROJECT.md` + `README.md`
(mentions), `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` (Phase 10 addendum).

## Verification

- **Authoring fidelity:** both skills embed their source procedures (roast's 5 personas + parallel
  spawn + the Judge + the exact verdict template + the 48-hour test; storm's 4 phases + 5 lenses +
  contradiction map + HTML-clone-keeping-`<style>` + self-review + parallel citation verification +
  the verification banner). The storm HTML template file is present. Every path the skills name is
  real or runtime-created.
- **Adaptations present:** roast persists `roast-verdict.md`, updates `wiki/vetting.md` + change-log,
  and offers/commissions storm (web-gated, folds findings into the verdict); storm writes to
  `outputs/vetting/<slug>/` and has the **Phase 0 web guard (refuse-don't-fabricate)**.
- **Wiring:** `define-project` offers the roast at the draft gate and records the charter `## Vetting`
  line; `what-can-i-do` shows the item; the `advise-project` change is additive only (no scoring/lens
  edits); `wc -l CLAUDE.md` **< 125** with the two bullets and the cap line bumped to `<125`;
  README/USING mention it; the design-spec addendum points here.
- **Graceful-off:** with no web, storm refuses cleanly (no fabricated citations) and roast still
  produces a verdict (Researcher reasoning-only). No key is requested anywhere.
- **No pollution:** `git status` clean aside from the intended files; **no real `wiki/vetting.md`, no
  `outputs/vetting/<date>-…` run** committed (only `outputs/vetting/.gitkeep`); `improve-system`
  unchanged (still the single applier / change-log writer); do **not** run a real roast/storm against
  this repo.

## Out of scope (v1)

- The bonus `session-handoff` skill in the Roast package (not requested).
- An AIOS console "Vetting" surface (the HTML briefings are browsable via `outputs/`; a read-only
  panel could come later — the seam is open).
- Auto-roasting an idea without asking (always offered + opt-in).
- Any change to `raw/` immutability, the approval discipline, or `improve-system`'s role.
