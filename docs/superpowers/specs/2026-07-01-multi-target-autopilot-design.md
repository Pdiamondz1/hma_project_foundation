# Design Spec: multi-target autopilot — one grill, more than one app

> Status: Approved (2026-07-01). Not yet implemented. A tier layered on the `autopilot` capstone
> (Phase 15). Call it **Phase 16**. Extends `autopilot` so a single grill can build **any combination of
> web (`app/`) + phone (`mobile/`) + browser extension (`plugin/`)** in one hands-off run, from the same
> charter + design + vetting. An **autopilot-only** change — the `build-*` skills are untouched. Tier 0
> (mock data, no keys/accounts). Never in `maintenance-loop`. No API keys.

## Context

**Why this is being built.** `autopilot` (Phase 15) collapses the whole journey into one goal → one grill
→ one confirm → hands-off build — but for **one** target chosen in the grill. The user's first deferred
tier is **multi-target**: one grill → build web + mobile + plugin (any subset) in a single run, so a
non-technical user gets their idea on every platform they want without re-running anything.

**Why it's a small, clean change (the groundwork is already there).** Since Phases 12–13 the three build
skills share one provenance spine: each writes its own `raw/builds/<date>-<slug>.md` (target-tagged) and
maintains its own section of the **shared** `wiki/build.md` (Web app / Mobile app / Browser extension).
So "build all three" is just "run all three builders off the same north-stars." Every upstream step —
`define-project`, `roast`, `storm-research`, `define-design` — already runs once and produces one shared
charter / verdict / briefing / design system. So this is an **autopilot-only** extension: the grill's
target question becomes multi-select, and Phase C loops over the chosen builders. **The `build-*` skills
need no changes** — their `## Autonomous invocation` notes already say "build my own target."

**Decision (made with the user this session).** Build the **multi-target** tier first (of the four
deferred autopilot tiers). *(The others — loop-aware build→improve, real-data/keyed builds, and a
silent no-grill mode — remain separate later phases.)*

**Intended outcome.** A user says "build my whole project," picks (say) web + phone in the grill, and
comes back to **both** a `app/` and a `mobile/` — one charter, one design, one vetting, coherent across
platforms — with one decision ledger and a preview command for each.

## Architecture

One change, localized to `autopilot`:

```
  grill (Phase A): target question → MULTI-SELECT {web, mobile, plugin}  → intake.md records the set
  Phase A upstream (define-project → roast → storm-research): UNCHANGED — runs once, shared north-stars
  Phase B: the single plan lists ALL chosen targets → one confirm
  Phase C: define-design (ONCE) → for EACH selected target: build-<target>  (independent — one failing
           doesn't stop the others)
  Phase D: per-target preview commands + the ledger
```

**Parts:**
1. **`autopilot` SKILL.md + config.json** *(modified)* — the multi-select grill, the `default_targets`
   config, the Phase C loop with per-target independence, and the per-target close-out.
2. **`docs/AUTOPILOT.md`** *(modified)* — the "one grill, one or more apps" story.
3. **The `build-*` skills, `define-*`, `roast`, `storm-research`** *(unchanged)* — already share the
   provenance spine and build their own target.

## The changes to `autopilot`

### 1. Config (`config.json`)
Replace `default_target` (string, `""`) with **`default_targets`** (array, default `[]`): `[]` = ask in
the grill; else a subset of `["web","mobile","plugin"]`. The `build_chain` value stays
`["define-design","build-<target>"]`, but its doc note clarifies that `build-<target>` now **iterates
over each selected target** (`build-app` for `web`, `build-mobile` for `mobile`, `build-plugin` for
`plugin`), after `define-design` runs once.

### 2. Grill target question (Phase A) → multi-select
The single Target question becomes: *"Which do you want to build — a web app, a phone app, a browser
extension, or any combination?"* It still recommends a **primary** target from purpose/audience, but the
user may pick **one or more** (up to all three); `default_targets` pre-selects when set. The chosen set
is written to `intake.md` (and carried into `plan.md`). Everything else in the grill (project + design
dims) is unchanged and shared across the targets.

### 3. Upstream (Phase A steps 2–4) — unchanged
`define-project` → `roast` (vet, KILL-upfront) → `storm-research` (research) run **exactly once** and
produce the one shared charter / verdict / briefing that every target is built from. Coherence across
platforms is automatic because they share the same north-stars.

### 4. Plan-confirm (Phase B) — lists the set
The single `plan.md` + confirm gate lists **all** chosen targets and what each will build (its folder +
screens/surfaces). One confirm covers the whole set; it satisfies each build skill's own gate.

### 5. Hands-off build (Phase C) — loop, with per-target independence
Run `define-design` **once** → `wiki/design-system.md`. Then, for **each** selected target in order
(web → mobile → plugin), run `build-<target>` (autonomous): scaffold its folder offline, write its
`raw/builds/<date>-<slug>.md` (target-tagged), update its section of the shared `wiki/build.md`, and log
the step to `run.md`. **Key semantic:** the targets are **independent of each other** (each depends only
on the shared charter + design, not on the other targets), so a **per-target build failure logs and
continues to the next target** — it does *not* abort the run (unlike the single-target hard-stop). A
failure in the shared `define-design` step *does* halt (all targets depend on it). Both are recorded in
`decisions.md` / `run.md`; the run is resumable.

### 6. Hand-over (Phase D) — per-target preview
The close-out names each built folder and gives the **preview command for each**: `app/` → `npm run dev`;
`mobile/` → `npm run start` (Expo Go QR); `plugin/` → `npm run build` + Chrome Load unpacked. The
decision ledger records the target set and each target's outcome (built / failed / skipped).

## Wiring (additive; light)

- **`autopilot/SKILL.md` frontmatter/description** — note it builds **one or more** of web/mobile/plugin
  (currently reads "→ build hands-off"). Keep the trigger list.
- **`docs/AUTOPILOT.md`** — the grill step + "what you end up with" note that you can pick several targets
  and get several apps from one run.
- **`README.md`** — extend the autopilot "What you get" bullet / add the Phase 16 build-status line.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — one clause on the multi-target option.
- **`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`** — a **Phase 16 addendum**.

## Not changed

`build-app` / `build-mobile` / `build-plugin` (they already build their own target + share the provenance
spine), `define-project` / `define-design` / `roast` / `storm-research` (run once, shared), the 7
`## Autonomous invocation` notes, `maintenance-loop`, `improve-system`, `raw/` immutability, and the
per-target confirm gates (autopilot's single gate still covers them all).

## Safety / tiers

- **Tier 0 unchanged.** Mock data, no keys/accounts; every target scaffolds offline (only the opt-in
  post-run `npm install` per target needs the network). Multi-target adds no keys or accounts.
- **Attended-started, hands-off-executed; never in `maintenance-loop`.** Unchanged — a human still starts
  it and gives the one plan-confirm.
- **Per-target independence** is a *robustness* improvement (a failed target doesn't sink the others),
  not a new risk surface. `improve-system` stays the single applier; autopilot writes no `change-log.md`
  line of its own.
- **Deferred (still later tiers):** loop-aware build→improve, real-data/keyed builds, silent no-grill mode.

## Files

**Modify (shipped):** `.claude/skills/autopilot/SKILL.md`, `.claude/skills/autopilot/config.json`,
`docs/AUTOPILOT.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`.

**Create (shipped):** none beyond the spec/plan docs.

**Runtime-only (not shipped):** the `app/`/`mobile/`/`plugin/` folders, the `raw/builds/` records, the
`outputs/autopilot/<date>-<slug>/` run folder — all created only when a user runs autopilot.

## Verification

- **Multi-select grill:** the Target question offers one-or-more of web/mobile/plugin and records the set
  to `intake.md`/`plan.md`; `config.json` has `default_targets` (array) and no stray single `default_target`.
- **Loop + independence:** Phase C runs `define-design` once then iterates `build-<target>` per selected
  target; a per-target build failure continues to the next (logged), while a `define-design` failure halts.
- **Shared upstream:** `define-project`/`roast`/`storm-research`/`define-design` still run once; the
  `build-*` skills + their `## Autonomous invocation` notes are byte-for-byte unchanged (`git diff` empty).
- **Safety:** `maintenance-loop`/`improve-system` unchanged; Tier 0 (no keys); never wired into the loop.
- **Wiring:** AUTOPILOT.md/README/USING mention the multi-target option; the master-spec Phase 16 addendum
  points here; CLAUDE.md unchanged or ≤ its 108 lines (< 125).
- **No pollution:** only the intended files changed; no real app/charter/run committed.

## Out of scope (this tier)

- **Parallel target builds** — v1 builds targets sequentially (simpler, and the scaffolds are fast); a
  future optimization could fan out per-target build agents.
- **Loop-aware build→improve, real-data/keyed builds, silent no-grill mode** — the other three deferred
  autopilot tiers; separate later phases.
- Any change to the `build-*` skills, `raw/` immutability, or `improve-system`'s single-applier role.
