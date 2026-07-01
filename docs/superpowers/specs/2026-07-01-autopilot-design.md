# Design Spec: `autopilot` — describe it once, come back to a built project

> Status: Approved (2026-07-01). Not yet implemented. The capstone orchestrator layered on the
> foundation (Phases 0–14). Call it **Phase 15**. One **user-initiated, then hands-off** skill that
> chains the existing pipeline — grill → vet → research → design → build — so a non-technical user
> describes their goal once and comes back to a built project. Tier 0 (mock data, no keys/accounts).
> **Never added to the unattended `maintenance-loop`.** Delegates its grunt work to the Phase 14
> `.claude/agents/` fleet. No API keys.

## Context

**Why this is being built.** The template has a deep toolbox — `define-project`, `roast`/`storm-research`,
`define-design`, `build-app`/`mobile`/`plugin` — but today **the user is the orchestrator and the
bottleneck**: they manually invoke 4+ interview-heavy skills, each with its own gates. The template's
whole purpose is to make it *easy to build anything*; constant engagement defeats that. The user wants
their **time back**: reach **absolute confidence and clarity UPFRONT** — gather the knowledge, **vet the
idea, and research it** — then let the project build itself in silence, surfacing only when it genuinely
must.

**The decided flow (the user's own words, refined across this session's clarifications — this ordering
is load-bearing).**
1. **Grill upfront** — start from the goal, then grill with questions to reach real clarity/confidence.
2. **Vet + research it upfront** — the goal is vetted (`roast`) and researched (`storm-research`) as part
   of reaching confidence, *before* anything is confirmed: *"All of this is about getting absolute
   confidence and clarity in order to run and build."* A **KILL** therefore surfaces *before* the confirm.
3. **Outline the plan, confirm once** — present the *already-vetted (GO), already-researched* plan for a
   single go.
4. **Run to finish, hands-off** — design → build with no interruptions (the idea is already GO-vetted, so
   there is no mid-build vetting stop).
5. **Review after** — every autonomous call logged for post-hoc review (approval shifts from
   approve-before-each-step to decide-then-review-after).

**The reconciliation (why it's safe).** The build skills are deliberately *"attended-only — never in the
unattended `maintenance-loop`"* because they write source + offer `npm install`. That forbids the
**unattended cron loop** from building — it does **not** forbid a **user-initiated** run from going
hands-off after the user kicks it off. So `autopilot` is **attended-STARTED, hands-off-EXECUTED**, and is
**never added to `maintenance-loop`**. Tier 0 (mock data, no keys/accounts) is the unlock: a Tier-0 run
has no account/key/publish blockers to force a mid-run stop (deeper tiers are OUT of v1).

**Decisions (made with the user this session).**
1. **Stop policy = run to finish; the one stop is a KILL verdict** — surfaced UPFRONT (pre-confirm), not
   mid-build. *(Rejected: full auto-reshape-through-KILL; and per-gate checkpoints.)*
2. **Intake = a single upfront grilling** that reaches clarity/confidence, then vets + researches, then
   outlines the plan for one confirm. *(Rejected: silent inference with no grilling — the user explicitly
   wants to be grilled upfront.)*
3. **Vet + research run UPFRONT**, ahead of the confirm gate (this session's refinement).
4. Name = **`autopilot`**. *(Rejected `build-anything` — overlaps the `build-*` verbs and hides the
   define/vet/design work.)*

**Intended outcome.** A non-technical user says "build my whole project," is grilled once, confirms one
vetted+researched plan, and comes back to a built, on-brand app — with a decision ledger of every call
the system made.

## Architecture

One attended-started, hands-off-executed orchestrator skill. It runs its own consolidated grill, drives
each existing sub-skill in a new **autonomous mode**, and records the run on a new ledger — delegating
grunt work to the Phase 14 fleet.

```
  "build my whole project" ─▶┌──────────────── autopilot ────────────────┐
  "take it from here"        │ A. grill (project+design+target, ONE pass)  │  ← all engagement here
  "run it on autopilot"      │    define-project → roast(VET) → storm(RESEARCH)  ← KILL = the one stop
  "/autopilot"               │ B. plan outline → SINGLE confirm gate       │  ← on a vetted+researched plan
                             │ C. define-design → build-<target>  (silent) ┼─▶ app/ | mobile/ | plugin/
                             │ D. hand over + decision ledger              │     outputs/autopilot/<date>-<slug>/
                             └─────────────────────────────────────────────┘     (charter/design/verdict/briefing/build via sub-skills)
```

**Parts, reusing existing patterns:**
1. **`autopilot` skill** *(new)* — the orchestrator; models its shape on `maintenance-loop` (drives
   sub-skills, writes a run log) + the build skills' phase/gate structure.
2. **The `## Autonomous invocation` note** *(added to 7 sub-skills)* — mirrors the sync skills'
   `## Unattended invocation` note; additive, leaves attended behavior unchanged.
3. **`outputs/autopilot/<date>-<slug>/`** *(runtime-created)* — the plan + decision ledger + run log.
4. **`docs/AUTOPILOT.md`** *(new)* — the how-to.

## The `autopilot` skill

`.claude/skills/autopilot/{SKILL.md,config.json}`. Frontmatter `name: autopilot` +
`argument-hint: "[describe your goal in one line, or leave blank and I'll ask]"`; triggers: "build my
whole project", "do the whole thing for me", "take it from here", "set it and forget it", "run it on
autopilot", "build it end-to-end", `/autopilot`. Zero-argument safe.

**`config.json`** (all defaulted; never block):
`{ "run_dir": "autopilot", "confidence_chain": ["define-project","roast","storm-research"], "build_chain": ["define-design","build"], "default_target": "", "grill_round_cap": 3, "research_upfront": true, "stop_on_kill": true, "auto_adopt_reshape": true }`
- `confidence_chain` — the UPFRONT phase (charter → vet → research), before the confirm gate.
- `build_chain` — the HANDS-OFF phase (design → build), after the gate.
- `research_upfront` (true) — run `storm-research` upfront; **web-gated / graceful-off** (skip with a
  logged note if offline — `roast` still vets via reasoning).
- `stop_on_kill` (true) — a KILL verdict is surfaced UPFRONT (before the gate), not mid-build.
- `default_target` — `""` = ask/infer in the grill; else `web|mobile|plugin`.

### Phase A — Upfront confidence & clarity (attended; all engagement + the vetting/research live here)

1. **Grill (ONE concentrated session).** `autopilot` runs its **own** consolidated interview so the
   sub-skills' interview code is never entered. Three domains back-to-back, each question offering **2–4
   options + a recommended default** (propose-don't-just-ask), reusing the sub-skills' option libraries
   *by reference*: **Project (5 dims)** purpose/audience/success/scope(In/Out/Later)/constraints (the
   `define-project` model + 5 starter archetypes) · **Design (5 dims)** style/color/type-&-shape/voice/
   targets (the `define-design` 5 style archetypes; direction inferred from the project answers) ·
   **Target (1)** web(`app/`)/phone(`mobile/`)/extension(`plugin/`). Follow-ups capped at
   `grill_round_cap`; anything still thin → recommended default flagged `(assumed — confirm later)` → the
   ledger. **Exit heuristic (encode as a checklist):** all 10 dims answered-or-defaulted, a target
   chosen, no unresolved scope-changing either/or.
2. **`define-project` (autonomous)** → writes `wiki/charter.md` + `raw/project/<date>-discovery.md` from
   the gathered answers (no interview, no draft-gate, no roast-offer — autopilot owns vetting).
3. **`roast` (autonomous) → vet the charter.** Skips the 4Q brief, convenes the 5-persona council, Judge
   returns **GO/RESHAPE/KILL** + cheapest 48h test → `outputs/vetting/<date>-<slug>/roast-verdict.md` +
   `wiki/vetting.md`.
   - **KILL → the one stop, UPFRONT** (user present): surface the verdict + biggest risk, ask **reshape /
     proceed-anyway / stop**. *reshape* → fold the pivot into the charter (define-project pivot mode),
     continue. *stop* → halt (charter+verdict remain; resumable). *proceed-anyway* → continue to the gate
     (the build record logs the override).
   - **RESHAPE →** auto-adopt the pivot (fold into charter), log, continue.
   - **GO →** continue.
4. **`storm-research` (autonomous, web-gated) → research the vetted idea.** Runs the STORM pipeline →
   `outputs/vetting/<date>-<slug>/<slug>-briefing.html`; fold the key findings into the plan.
   **Graceful-off:** if web is unavailable, skip with a logged note ("research skipped — offline") and
   proceed (the `roast` vetting already ran via reasoning).

### Phase B — Plan outline + SINGLE confirm gate (on a vetted + researched plan)

Write the confirmed intent to `outputs/autopilot/<date>-<slug>/plan.md` and show it in ONE message:
charter summary + **the GO verdict + the cheapest test** + **the key research findings** + design
direction + target + what it will build + the `(assumed — confirm later)` list. Ask **one** question:
*"This is the plan — already vetted (**GO**) and researched. After you say go, I'll design it and build it
end-to-end **without stopping**. Every judgment call gets logged for you to review after. Go? (yes /
tweak)."* `yes` **satisfies each build skill's own confirm gate**; the hands-off build begins.

### Phase C — Hands-off build (silent; after the gate)

Run `build_chain` in order, driving each sub-skill in **autonomous mode**, logging each step. **No vetting
stop (already GO); it only halts on a genuine failure** (graceful + resumable):
1. `define-design` (autonomous) → infers direction from charter + gathered design answers; synthesizes
   from the interview alone (Stitch/console-theming are opt-in attended, skipped) → `wiki/design-system.md`
   + `raw/design/<date>-<slug>/`.
2. `build-<target>` (autonomous) → reads charter + design + the GO verdict; **skips its confirm gate**
   (autopilot's gate covered it); scaffolds `app/`|`mobile/`|`plugin/` **offline** (does NOT run
   `npm install` — preview stays a post-run offer) → `raw/builds/<date>-<slug>.md` + `wiki/build.md` + its
   own `applied` change-log line.

### Phase D — Post-hoc review

Close by pointing the user at the decision ledger, the run log, the vetting verdict + research briefing,
and the one-command preview path for the target.

## The additive "Autonomous invocation" contract (per sub-skill)

Add ONE new `## Autonomous invocation` H2 to `define-project`, `roast`, `storm-research`, `define-design`,
`build-app`, `build-mobile`, `build-plugin` — mirroring the sync skills' existing `## Unattended
invocation` note. **Attended behavior above it is byte-for-byte unchanged.** Shared preamble: *when
invoked by `autopilot`, don't open your interview; read the consolidated plan
(`outputs/autopilot/<date>-<slug>/plan.md`) + north-stars; infer/pick your recommended defaults, flag
each `(assumed — confirm later)` in your artifact AND report it to the ledger; skip your own
draft-confirm/confirm gate (autopilot owns the single gate); then write your artifact + provenance +
change-log line exactly as attended.* Specializations: `define-project` skips its roast-offer;
`roast` skips the 4Q batch + hands KILL/RESHAPE to autopilot; **`storm-research` runs upfront, web-gated
(refuses/skips offline rather than fabricating)**; `define-design` never runs console-theming; `build-*`
skip the Phase 2 gate and don't run `npm install`. The *"never in `maintenance-loop`"* rule is untouched.
This leverages what already exists: build-* are autonomous-shaped (route-don't-guess, single gate,
RESHAPE→auto-build, KILL "build anyway"); define-project/define-design already have propose-default +
`(assumed — confirm later)` machinery; roast already returns a hard verdict.

## The decision ledger + run record

Per-run dir **`outputs/autopilot/<YYYY-MM-DD>-<slug>/`** (dated-slug + `-2` same-day convention). Three
RAG-frontmatter files:
- **`plan.md`** — the confirmed, vetted+researched plan (the single-gate artifact the sub-skills read).
- **`decisions.md`** — the **ledger**: append-only, stable `ap-YYYYMMDD-NNN` ids (never renumber), one
  anchor line + `why / basis / review` block per call; `type ∈ {assumption|inference|verdict|reshape|
  override|default}`. **Plain bullets, not checkboxes** (nothing consumes them the way `improve-system`
  consumes `review-*.md` — avoid implying an approve-before gate). Records the GO/RESHAPE/KILL verdict,
  any override, and the research outcome.
- **`run.md`** — append-only step log (newest-first, like `outputs/runs/maintenance-loop.md`): timestamp,
  sub-skill, status (ok / stopped-KILL / skipped-offline / failed), artifact path, verdict, error.
- **Run-state `outputs/runs/autopilot.json`** — `{last_run,current_slug,phase,status,step_index,counts,
  error}` for resumability/idempotency.

The ledger **links to, never duplicates** the canonical artifacts the sub-skills author (charter/design/
verdict/briefing/build record). **`autopilot` writes no `change-log.md` line of its own** (orchestrator
precedent — the sub-skills, incl. `build-*`'s `applied` line, write theirs). Ship
**`outputs/autopilot/.gitkeep`**.

## Delegating to the Phase 14 fleet

Where autopilot spawns subagents for grunt work, it uses the tuned fleet rather than generic
`general-purpose`: `roast`'s Researcher persona and `storm-research`'s lenses run as `web-researcher`
(per Phase 14's additive wiring, keeping their persona prompts/output contracts). The whole point of
Phase 14 was to make this hands-off run cheap (model-mix) and safe (least-tools); autopilot is its first
big consumer.

## Edge cases

- **KILL (the one stop) — handled UPFRONT, before the confirm** → reshape / proceed-anyway / stop
  (recorded). Because it's pre-gate and the user is present, the hands-off build never needs a vetting
  stop.
- **RESHAPE (non-KILL)** → auto-adopt (fold pivot, log, continue, no pause).
- **Research offline** → skip `storm-research` with a logged note; proceed on the `roast` verdict alone.
- **Thin goal** → default-with-assumption up to `grill_round_cap`; worst case is an assumption-heavy
  `plan.md` the user corrects at the single confirm — never a silent block.
- **Sub-skill failure mid-run** → chain has hard deps, so stop gracefully: log, set `status=failed` +
  `step_index`; **resumable** (re-invoke reads `autopilot.json` + on-disk artifacts, resumes from the
  failed step).
- **Re-run** → resume / extend / restart (never blind redo; sub-skills already idempotent/incremental).
- **Charter/design already exist** → the grill offers use-as-is / refine / start-fresh; never silent
  overwrite.

## Wiring (additive; mirrors prior phases). **Do NOT touch `maintenance-loop` or `improve-system`.**

- `.claude/skills/autopilot/{SKILL.md,config.json}` (new).
- `## Autonomous invocation` note added to the 7 sub-skills (attended sections unchanged).
- `.claude/skills/what-can-i-do/SKILL.md` — a top menu line: *"Build my whole project for me — describe
  it once, come back to a built app → runs `autopilot`."*
- `.claude/skills/setup-project/SKILL.md` — extend the step-8 build offer to add the one-go `autopilot`
  path (propose-only; never auto-run).
- `CLAUDE.md` — one lean skill bullet with the invariant folded in ("user-initiated capstone orchestrator:
  upfront grill + vet + research → one plan-confirm → hands-off design+build … **attended-started,
  hands-off-executed — never in `maintenance-loop`**"). Keep the file **< 125 lines** (currently 107).
- `docs/AUTOPILOT.md` (new) — the how-to (mirrors `docs/BUILD-APP.md` shape).
- `README.md` + `docs/USING-THIS-FOR-ANY-PROJECT.md` — the express-lane line + a Phase 15 build-status
  line in README.
- `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` — a **Phase 15 addendum** in the
  same voice as the prior addenda.

## Graceful-off / keys / tiers / safety

- **Attended-started, hands-off-executed; NEVER added to `maintenance-loop`.** A human types the goal and
  gives the single plan-confirm; the unattended cron tick never chains into autopilot or the `build-*`
  skills. `maintenance-loop/SKILL.md` is **not** modified.
- **Tier 0 / no keys / no accounts / mock data.** v1 has no backend, auth, deploy, env, or secrets;
  nothing is collected in chat. Deeper-tier/keyed builds are OUT of v1. `improve-system` stays the single
  applier; `raw/` immutable.
- **No API keys are ever collected in chat.**

## Files

**Create (shipped):** `.claude/skills/autopilot/SKILL.md`, `.claude/skills/autopilot/config.json`,
`docs/AUTOPILOT.md`, `outputs/autopilot/.gitkeep`. (The `outputs/autopilot/<date>-<slug>/` run artifacts,
`outputs/runs/autopilot.json`, and every north-star the sub-skills write are **runtime-only — not
shipped**.)

**Modify (shipped):** `.claude/skills/define-project/SKILL.md`, `.claude/skills/roast/SKILL.md`,
`.claude/skills/storm-research/SKILL.md`, `.claude/skills/define-design/SKILL.md`,
`.claude/skills/build-app/SKILL.md`, `.claude/skills/build-mobile/SKILL.md`,
`.claude/skills/build-plugin/SKILL.md`, `.claude/skills/what-can-i-do/SKILL.md`,
`.claude/skills/setup-project/SKILL.md`, `CLAUDE.md`, `README.md`,
`docs/USING-THIS-FOR-ANY-PROJECT.md`, `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`.

## Verification

- **Authoring fidelity:** the skill has the four phases (upfront grill → vet+research → single confirm →
  hands-off build → post-hoc review), the KILL-upfront handling, the ledger paths, the resumable
  run-state, and the config keys.
- **Additive contract:** each of the 7 sub-skills gains a `## Autonomous invocation` note AND keeps its
  attended interview/gates intact (diff proves nothing removed — additive-only).
- **Safety:** `maintenance-loop` + `improve-system` byte-for-byte unchanged (`git diff` empty); autopilot
  is never wired into the loop; `npm install` is offered not run; no keys/accounts requested.
- **Wiring:** `what-can-i-do`/`setup-project` additive + propose-only; `CLAUDE.md` < 125 with the bullet;
  README/USING mention autopilot; the master-spec Phase 15 addendum points here; new `docs/AUTOPILOT.md`.
- **No pollution:** ships the skill + config + doc + additive wiring + `outputs/autopilot/.gitkeep` ONLY;
  **`autopilot` is never run for real against the template** — no charter/design/verdict/briefing/
  `app`/`mobile`/`plugin`/ledger committed; `git diff --name-only main..HEAD` limited to the intended
  files.

## Out of scope (v1)

- **Loop-aware autopilot** — folding `improve-system`/`advise-project` in as a post-build pass.
- **Multi-target** — building web + mobile + plugin from one grill in a single run.
- **Deeper-tier / keyed builds** — real data/accounts/deploy (Supabase, EAS, Web Store), which bring
  account/key/publish blockers; deliberately out of the no-keys v1.
- **A fully-silent no-grill mode** — accept a rich written brief and skip even the plan-confirm.
- Any change to `raw/` immutability, the approval discipline, or `improve-system`'s single-applier role.
