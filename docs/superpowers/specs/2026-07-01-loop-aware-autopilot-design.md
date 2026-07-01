# Design Spec: loop-aware autopilot — a post-build "what's next" pass

> Status: Approved (2026-07-01). Not yet implemented. A tier layered on the `autopilot` capstone
> (Phases 15–16). Call it **Phase 17**. Adds a **Phase E — post-build advise**: after autopilot builds,
> it runs `advise-project` (propose-only) focused on the just-built project, filing ranked "what's next"
> ideas to `outputs/ideas-*.md`. An autopilot-only + one-additive-note change; `improve-system`,
> `maintenance-loop`, and the `build-*` skills are untouched. Tier 0. Never in `maintenance-loop`. No keys.

## Context

**Why this is being built.** `autopilot` (Phase 15) + multi-target (Phase 16) take a user from one goal to
a built, vetted, designed project — then stop. The next deferred tier is **loop-aware**: close the
**build → improve** loop, so once the build finishes, autopilot proposes the **next moves** for the
project it just built. This is the second of the four deferred autopilot tiers.

**The right engine (confirmed by research + the user's choice).** `advise-project` — the template's
**propose-only, outward-facing** idea engine. It already reads `wiki/charter.md` as project identity, runs
four lenses (`improve` / `scale` / `maintain` / `pattern`), and files ranked ideas to `outputs/ideas-*.md`
with stable ids, never applying anything (writes only inside `outputs/`; `improve-system` stays the single
applier). `improve-system` is the **wrong** tool here — it is *inward* (it heals the template/foundation:
wiki contradictions, broken links, skill friction) and it *applies* changes. So loop-aware = a **post-build
`advise-project` pass**, focused on what was just built. *(Rejected: including `improve-system` — it
improves the template, not the user's app, and isn't propose-only.)*

**Rich grounding already exists post-build:** the charter's deferred `Later`/`Out` items, the decision
ledger's `(assumed — confirm later)` flags (`outputs/autopilot/<date>-<slug>/decisions.md`), the build
record (`raw/builds/`, the run's `plan.md`/`run.md`), the per-target build outcomes, and the deferred tiers
(real data, deploy, more targets) — all perfect raw material for ranked "what to do next" ideas. (Note:
the `raw/metrics/` usage feed will be empty for a fresh build — no users yet — which is expected;
`advise-project` skips missing signals gracefully.)

**Intended outcome.** After autopilot builds, it runs `advise-project` (propose-only, hands-off) grounded
on the just-built project, and the close-out points the user at a ranked list of next moves in
`outputs/ideas-*.md` — waiting for approval, nothing applied. The arc becomes **define → vet → design →
build → advise (what's next)**.

## Architecture

One localized change to `autopilot` + one additive note to `advise-project`:

```
  Phase A–D (grill → vet → research → confirm → build → hand-over): UNCHANGED
  Phase E (NEW, if config.advise_after_build): run advise-project — post-build focus
           → ranked ideas in outputs/ideas-*.md (propose-only, hands-off)
           → close-out points the user at the ideas alongside the decision ledger
```

**Parts:**
1. **`autopilot` SKILL.md + config.json** *(modified)* — a new Phase E; the `advise_after_build` flag; the
   frontmatter/description + close-out mention.
2. **`advise-project` SKILL.md** *(modified — additive only)* — a `## Post-build invocation` note, mirroring
   the `## Autonomous invocation` notes autopilot added to the build skills.
3. **`improve-system`, `maintenance-loop`, the build-* / define-* / roast / storm skills** *(unchanged)*.

## The changes

### 1. New autopilot **Phase E — Post-build advise** (SKILL.md)
After Phase D (hand-over), if `config.advise_after_build` (default `true`), run `advise-project` in a
**post-build focus**: ground it on the just-built charter (especially `Later`/`Out`), the decision-ledger
`(assumed — confirm later)` flags, the build record (`raw/builds/` + the run's `plan.md`/`run.md` +
per-target outcomes), and the deferred tiers — to file ranked "what's next" ideas to `outputs/ideas-*.md`.
It is **propose-only and hands-off** — nothing is applied, so there is **no confirm gate**. Log the pass to
the run's `run.md`, and in the close-out (Phase D) point the user at the ideas file alongside the decision
ledger ("here's what I'd do next — approve any you like").

### 2. `advise-project` additive `## Post-build invocation` note (SKILL.md)
Add ONE new `## Post-build invocation` H2 (mirroring the sync skills' `## Unattended invocation` note and
the build skills' `## Autonomous invocation` note): *when invoked by `autopilot` right after a build,
focus the four lenses on the just-built project* — the charter `Later`/`Out` items → `scale`/`improve`
ideas; the ledger's `(assumed — confirm later)` flags → `maintain`/validate ideas; the deferred tiers →
next-step ideas; the build record → what exists now (metrics may be empty — that's fine). Write to
`outputs/ideas-*.md` exactly as normal, honoring every propose-only invariant (writes only in `outputs/`,
never applies, `improve-system` stays the single applier, stable `idea-YYYYMMDD-NNN` ids, the
`max_ideas_per_tick` cap, dedup via `ideas-log.md`). **Its attended and maintenance-loop (unattended)
behavior above the note are byte-for-byte unchanged** — this note is additive.

### 3. Config (`config.json`)
Add `advise_after_build` (default `true`) — run the Phase E post-build advise pass at the end of a run.
Setting it `false` skips Phase E.

### 4. Frontmatter / docs
The autopilot description gains a short "…then proposes what to build next" clause; `docs/AUTOPILOT.md`
gains a "what's next" step; README/USING get one line each; the master spec gets a Phase 17 addendum.

## Not changed

`improve-system` (inward, single applier), `maintenance-loop` (still runs `advise-project` as its own
unattended step 4), the `build-*` / `define-*` / `roast` / `storm-research` skills, `raw/` immutability.
`advise-project`'s existing attended + unattended behavior is preserved byte-for-byte (additive note only).

## Safety / reconciliation

- **Propose-only end to end.** `advise-project` never applies and writes only inside `outputs/`; Phase E is
  therefore safe to run hands-off with no confirm gate. `improve-system` stays the single applier and the
  sole `change-log.md` writer.
- **Tier 0; still user-initiated; still never in `maintenance-loop`.** Phase E adds no keys/accounts.
- **No double-advise / no conflict.** The maintenance-loop's own `advise-project` step is unchanged; the
  post-build pass is a distinct, user-initiated invocation and dedups normally via the existing
  `ideas-log.md`. Both invocations share `advise-project`'s state (`outputs/runs/advise-project.json`) as
  designed.

## Files

**Modify (shipped):** `.claude/skills/autopilot/SKILL.md`, `.claude/skills/autopilot/config.json`,
`.claude/skills/advise-project/SKILL.md`, `docs/AUTOPILOT.md`, `README.md`,
`docs/USING-THIS-FOR-ANY-PROJECT.md`, `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`.

**Runtime-only (not shipped):** `outputs/ideas-*.md`, `outputs/ideas-log.md`, `outputs/runs/advise-project.json`,
and the autopilot run folder — created only when a user runs autopilot.

## Verification

- **Phase E present:** autopilot SKILL.md has a `Phase E` post-build advise section that runs
  `advise-project` (propose-only, no confirm gate) gated on `config.advise_after_build`; `config.json` has
  `advise_after_build` (default true).
- **Additive note:** `advise-project/SKILL.md` has a new `## Post-build invocation` note AND its existing
  sections (the interview, `## Unattended invocation`, the propose-only Safety invariants) are intact — the
  diff shows **0 deletions** on that file.
- **Untouched:** `improve-system` / `maintenance-loop` / `build-*` / `raw` are byte-for-byte unchanged
  (`git diff` empty); `advise-project` stays propose-only (never applies, `improve-system` single applier).
- **No pollution:** no real `outputs/ideas-*.md` / run artifacts committed; only the intended files in
  `git diff --name-only main..HEAD`; CLAUDE.md < 125.

## Out of scope (this tier)

- **Auto-applying any proposed idea** — Phase E is propose-only; the user approves ideas later (a
  project-lane approval → a brief; a foundation-lane approval → a review item), exactly as today.
- **Including `improve-system`** in the post-build pass — it heals the template, not the user's app.
- **The other two deferred autopilot tiers** — real-data/keyed builds and a silent no-grill mode — remain
  separate later phases.
- Any change to `advise-project`'s scoring, lenses, or propose-only role; to `raw/` immutability; or to
  `improve-system`'s single-applier role.
